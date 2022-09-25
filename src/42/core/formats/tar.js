import { AbsorbArrayBuffer } from "../stream/absorb.js"
import headers from "./tar/headers.js"

function overflow(size) {
  size &= 511
  return size && 512 - size
}

function makeFile(buffer, header, enqueue) {
  const file = new File([buffer], header.name, { lastModified: header.mtime })
  enqueue({ header, file })
  return header.size + overflow(header.size)
}

function mixinPax(header, pax) {
  if (pax.path) header.name = pax.path
  if (pax.linkpath) header.linkname = pax.linkpath
  if (pax.size > 0) header.size = Number.parseInt(pax.size, 10)
  header.pax = pax
  return header
}

function createConsumer(enqueue) {
  const absorb = new AbsorbArrayBuffer()

  let offset = 0
  let header
  let pax

  function consume() {
    if (header) {
      if (header.type === "file" && absorb.pointer >= offset + header.size) {
        const buffer = absorb.view.slice(offset, offset + header.size)
        if (pax) mixinPax(header, pax)
        offset += makeFile(buffer, header, enqueue)
        header = undefined
        consume()
      } else if (
        header.type === "pax-header" &&
        absorb.pointer >= offset + header.size
      ) {
        const buffer = absorb.view.slice(offset, offset + header.size)
        pax = headers.decodePax(buffer)
        offset += header.size + overflow(header.size)
        header = undefined
        consume()
      }
    } else if (absorb.pointer > offset + 512) {
      header = headers.decode(absorb.view.slice(offset, offset + 512))

      if (header?.size === 0 || header?.type === "directory") {
        enqueue({ header })
        header = undefined
      }

      offset += 512
      consume()
    }
  }

  return { absorb, consume }
}

export function extract() {
  let absorb
  let consume

  return new TransformStream({
    start(controller) {
      const consumer = createConsumer((chunk) => controller.enqueue(chunk))
      absorb = consumer.absorb
      consume = consumer.consume
    },
    async transform(chunk) {
      absorb.add(chunk)
      consume()
    },
    flush() {
      delete absorb.memory
      delete absorb.view
      absorb = undefined
    },
  })
}

export default { extract }
