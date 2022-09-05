import { AbsorbArrayBuffer } from "../../fabric/type/stream/absorb.js"
import headers from "./tar/headers.js"

const overflow = function (size) {
  size &= 511
  return size && 512 - size
}

function createConsumer(enqueue) {
  const absorb = new AbsorbArrayBuffer()

  let offset = 0
  let header

  function consume() {
    // console.log(offset, absorb.view.slice(offset, offset + 512))
    if (header) {
      if (
        header.type === "file" &&
        absorb.view.length >= offset + header.size
      ) {
        const file = new File(
          [absorb.view.slice(offset, offset + header.size)],
          header.name,
          { lastModified: header.mtime }
        )
        enqueue({ header, file })
        offset += header.size + overflow(header.size)
        header = undefined
        consume()
      }
    } else if (absorb.view.length >= offset + 512) {
      header = headers.decode(absorb.view.slice(offset, offset + 512))
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
