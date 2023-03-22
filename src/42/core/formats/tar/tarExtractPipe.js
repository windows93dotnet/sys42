import Buffer from "../../../fabric/binary/Buffer.js"
import getBasename from "../../path/core/getBasename.js"
import {
  decodeTarHeader,
  decodePax,
  decodeLongPath,
} from "./decodeTarHeader.js"

function overflow(size) {
  size &= 511
  return size && 512 - size
}

function makeFile(buffer, header, controller) {
  const { offset } = buffer
  Object.defineProperties(header, {
    file: {
      get() {
        return new File(
          [buffer.toArrayBuffer(offset, offset + header.size)],
          getBasename(header.name),
          { lastModified: header.mtime }
        )
      },
    },
  })
  controller.enqueue(header)
  return header.size + overflow(header.size)
}

function mixinPax(header, pax) {
  if (pax.path) header.name = pax.path
  if (pax.linkpath) header.linkname = pax.linkpath
  if (pax.size > 0) header.size = Number.parseInt(pax.size, 10)
  header.pax = pax
  return header
}

function createConsumer(options, controller) {
  const buffer = new Buffer()

  let header
  let pax

  function consume() {
    if (header) {
      if (buffer.length < buffer.offset + header.size) return

      if (header.type === "file") {
        if (pax) mixinPax(header, pax)
        buffer.offset += makeFile(buffer, header, controller)
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
          options?.filenameEncoding
        )
        buffer.offset += overflow(header.size)
        header = undefined
        consume()
      }
    } else if (buffer.length > buffer.offset + 512) {
      header = decodeTarHeader(buffer.read(512), options)

      if (header?.size === 0 || header?.type === "directory") {
        controller.enqueue(header)
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

  const tsExtract = new TransformStream({
    start(controller) {
      const consumer = createConsumer(options, controller)
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
    },
  })

  const ts = new TransformStream()

  let { readable } = ts

  if (options?.gzip) {
    readable = readable.pipeThrough(new DecompressionStream("gzip"))
  }

  readable = readable.pipeThrough(tsExtract)

  Object.defineProperty(ts, "readable", { value: readable })

  return ts
}

export default tarExtractPipe
