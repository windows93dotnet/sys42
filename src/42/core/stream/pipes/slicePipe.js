// @src https://deno.land/std@0.162.0/streams/buffer.ts?source#L247
export function slicePipe(start = 0, end = Infinity) {
  let offsetStart = 0
  let offsetEnd = 0
  return new TransformStream({
    transform(chunk, controller) {
      offsetStart = offsetEnd
      offsetEnd += chunk.byteLength
      if (offsetEnd > start) {
        if (offsetStart < start) {
          chunk = chunk.slice(start - offsetStart)
        }

        if (offsetEnd >= end) {
          chunk = chunk.slice(0, chunk.byteLength - offsetEnd + end)
          controller.enqueue(chunk)
          controller.terminate()
        } else {
          controller.enqueue(chunk)
        }
      }
    },
  })
}

export default slicePipe
