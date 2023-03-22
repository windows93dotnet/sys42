import Buffer from "../../../fabric/binary/Buffer.js"
import getBasename from "../../path/core/getBasename.js"
import slicePipe from "../../stream/pipes/slicePipe.js"
import {
  decodeTarHeader,
  decodePax,
  decodeLongPath,
} from "./decodeTarHeader.js"

function overflow(size) {
  size &= 511
  return size && 512 - size
}

function makeFile(carrier, offset, header, enqueue) {
  Object.defineProperties(header, {
    file: {
      async value() {
        const res = new Response(header.stream())
        return new File([await res.arrayBuffer()], getBasename(header.name), {
          lastModified: header.mtime,
        })
      },
    },

    stream: {
      value() {
        const [a, b] = carrier.readable.tee()
        carrier.readable = a
        return b.pipeThrough(slicePipe(offset, offset + header.size))
      },
    },
  })
  enqueue(header)
  return header.size + overflow(header.size)
}

function mixinPax(header, pax) {
  if (pax.path) header.name = pax.path
  if (pax.linkpath) header.linkname = pax.linkpath
  if (pax.size > 0) header.size = Number.parseInt(pax.size, 10)
  header.pax = pax
  return header
}

function createConsumer(carrier, enqueue) {
  const buffer = new Buffer()

  let header
  let pax

  function consume() {
    if (header) {
      if (buffer.length < buffer.offset + header.size) return

      if (header.type === "file") {
        if (pax) mixinPax(header, pax)
        buffer.offset += makeFile(carrier, buffer.offset, header, enqueue)
        header = undefined
        consume()
      } else if (header.type === "pax-header") {
        pax = decodePax(buffer.read(header.size))
        buffer.offset += overflow(header.size)
        header = undefined
        consume()
      } else if (header.type === "gnu-long-path") {
        header.name = decodeLongPath(
          buffer.read(header.size),
          carrier.options?.filenameEncoding
        )
        buffer.offset += overflow(header.size)
        header = undefined
        consume()
      }
    } else if (buffer.length > buffer.offset + 512) {
      header = decodeTarHeader(buffer.read(512), carrier.options)

      if (header?.size === 0 || header?.type === "directory") {
        enqueue(header)
        header = undefined
      }

      consume()
    }
  }

  return { buffer, consume }
}

export function tarExtractPipe(options) {
  let buffer
  let consume

  const carrier = { options, missing: 0 }

  const tsExtract = new TransformStream({
    start(controller) {
      const consumer = createConsumer(carrier, (chunk) =>
        controller.enqueue(chunk)
      )
      buffer = consumer.buffer
      consume = consumer.consume
    },
    async transform(chunk) {
      buffer.write(chunk)
      consume()
    },
    flush() {
      if (buffer.length < buffer.offset && options?.allowIncomplete !== true) {
        throw new Error("Unexpected end of data")
      }

      delete buffer.memory
      buffer = undefined
    },
  })

  const ts = new TransformStream()

  let { readable } = ts

  if (options?.gzip) {
    readable = readable.pipeThrough(new DecompressionStream("gzip"))
  }

  const [a, b] = readable.tee()

  carrier.readable = a
  Object.defineProperty(ts, "readable", { value: b.pipeThrough(tsExtract) })

  return ts
}

export default tarExtractPipe
