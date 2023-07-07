// @related https://github.com/dominictarr/event-stream
// @read https://web.dev/streams/
// @read https://wicg.github.io/compression/
// @read https://github.com/openpgpjs/web-stream-tools
// @read https://whatwg-stream-visualizer.glitch.me/
// @read https://web.dev/websocketstream/
// @read https://github.com/SocketDev/wormhole-crypto
// @read https://github.com/surma/observables-with-streams
// @read https://www.sitepen.com/blog/a-guide-to-faster-web-app-io-and-data-operations-with-streams

if ("DecompressionStream" in globalThis === false) {
  await import("./env/polyfills/globalThis.DecompressionStream.min.js")
}

import combineArrayBufferView from "../fabric/binary/combineArrayBufferView.js"
import nextCycle from "../fabric/type/promise/nextCycle.js"
import sleep from "../fabric/type/promise/sleep.js"

import slicePipe from "./stream/pipes/slicePipe.js"
export { slicePipe }

import absorb from "./stream/absorb.js"
export { absorb }

export async function collect(rs, encoding = "auto") {
  const buffer = absorb(encoding)
  await rs.pipeTo(new WritableStream({ write: (chunk) => buffer.add(chunk) }))
  return buffer.value
}

export function wrap(stream, { before, after }, queuingStrategy) {
  let reader
  let encoder
  return new ReadableStream(
    {
      async pull(controller) {
        if (!reader) {
          encoder = new TextEncoder()
          reader = stream.getReader()
          if (before) controller.enqueue(encoder.encode(before))
        }

        const { value, done } = await reader.read()
        if (done) {
          if (after) controller.enqueue(encoder.encode(after))
          controller.close()
        } else controller.enqueue(value)
      },
    },
    queuingStrategy,
  )
}

/* sources
========== */

export function source(data, queuingStrategy) {
  if (data instanceof Response) return data.body
  if (data instanceof ReadableStream) return data
  if (Array.isArray(data)) {
    const encoder = new TextEncoder()
    let i = 0
    const l = data.length
    return new ReadableStream(
      {
        async pull(controller) {
          if (i < l) {
            let chunk = data[i++]
            if (typeof chunk === "string") chunk = encoder.encode(chunk)
            controller.enqueue(chunk)
          } else controller.close()
        },
      },
      queuingStrategy,
    )
  }

  // TODO: fix stream polyfill to allow use of Response.body
  // return new Response(data).body
  return new Blob([data]).stream()
}

export function arraySource(data, queuingStrategy) {
  let i = 0
  const l = data.length
  return new ReadableStream(
    {
      async pull(controller) {
        if (i < l) {
          controller.enqueue(data[i++])
        } else controller.close()
      },
    },
    queuingStrategy,
  )
}

export function iteratorSource(iterator, queuingStrategy) {
  return new ReadableStream(
    {
      async pull(controller) {
        const { value, done } = await iterator.next()
        if (done) controller.close()
        else controller.enqueue(value)
      },
    },
    queuingStrategy,
  )
}

/* sinks
======== */

export function sink(cb, encoding = "auto") {
  if (typeof cb !== "function") return new WritableStream()
  const buffer = absorb(encoding)
  return new WritableStream({
    write: (chunk) => buffer.add(chunk),
    close: () => cb(buffer.value),
  })
}

export function eachSink(cb) {
  let i = 0
  const ws = new WritableStream({
    async write(chunk, controller) {
      const res = await cb(chunk, i++)
      if (res === false) controller.error()
    },
  })
  return ws
}

/* pipes
======== */

const DEFAULT_WATERMARK = [{ highWaterMark: 1 }, { highWaterMark: 0 }]

export const textPipe = (encoding) => new TextDecoderStream(encoding)
export const arrayBufferPipe = () => new TextEncoderStream()
export const compressPipe = (type = "gzip") => new CompressionStream(type)
export const decompressPipe = (type = "gzip") => new DecompressionStream(type)

export function mapPipe(cb) {
  let i = 0
  return new TransformStream(
    {
      async transform(chunk, controller) {
        controller.enqueue(await cb(chunk, i++))
      },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function eachPipe(cb) {
  let i = 0
  return new TransformStream(
    {
      async transform(chunk, controller) {
        await cb(chunk, i++)
        controller.enqueue(chunk)
      },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function filterPipe(cb) {
  return new TransformStream(
    {
      async transform(chunk, controller) {
        if (await cb(chunk)) controller.enqueue(chunk)
      },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function splitPipe(delimiter = "", options) {
  let buffer = ""
  const end = options?.include ? delimiter : ""
  return new TransformStream(
    {
      transform(chunk, controller) {
        buffer += chunk
        const parts = buffer.split(delimiter)
        for (const part of parts.slice(0, -1)) controller.enqueue(part + end)
        buffer = parts.at(-1)
      },
      flush(controller) {
        if (buffer) controller.enqueue(buffer)
      },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function joinPipe(delimiter = "") {
  let buffer = ""
  let first = false
  return new TransformStream(
    {
      transform(chunk, controller) {
        if (first) controller.enqueue(buffer + delimiter)
        else first = true
        buffer = chunk
      },
      flush(controller) {
        if (buffer) controller.enqueue(buffer)
      },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function cutPipe(size, options) {
  let prevArr
  let prevStr
  return new TransformStream(
    {
      transform:
        options?.exact === false
          ? async (chunk, controller) => {
              for (let i = 0, l = chunk.length; i < l; i += size) {
                controller.enqueue(chunk.slice(i, i + size))
                await 0
              }
            }
          : async (chunk, controller) => {
              let i = 0

              if (prevArr) {
                i = size - prevArr.length
                controller.enqueue(
                  combineArrayBufferView(prevArr, chunk.slice(0, i)),
                )
                prevArr = undefined
              }

              if (prevStr) {
                i = size - prevStr.length
                controller.enqueue(prevStr + chunk.slice(0, i))
                prevStr = undefined
              }

              for (let l = chunk.length; i < l; i += size) {
                if (i + size > l) {
                  if (typeof chunk === "string") prevStr = chunk.slice(i)
                  else prevArr = chunk.slice(i)
                } else controller.enqueue(chunk.slice(i, i + size))
                await 0
              }
            },
      flush:
        options?.exact === false
          ? undefined
          : (controller) => {
              if (prevArr) controller.enqueue(prevArr)
              if (prevStr) controller.enqueue(prevStr)
            },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function percentPipe(total, cb) {
  let bytes = 0
  return new TransformStream(
    {
      transform(chunk, controller) {
        bytes += chunk.length
        cb((100 * bytes) / total, bytes, total)
        controller.enqueue(chunk)
      },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function pressurePipe(fn = nextCycle) {
  if (typeof fn === "number") {
    const ms = fn
    fn = async () => sleep(ms)
  }

  return new TransformStream(
    {
      async transform(chunk, controller) {
        controller.enqueue(chunk)
        await fn()
      },
    },
    ...DEFAULT_WATERMARK,
  )
}

export function pipeline(a, ...transforms) {
  if (Array.isArray(a)) [a, ...transforms] = a
  let readable = a.readable || a
  transforms.forEach((transform) => {
    readable = readable.pipeThrough(transform)
  })
  return a.writable ? { writable: a.writable, readable } : readable
}

const stream = {
  absorb,
  collect,
  pipeline,
  wrap,

  source,
  sink,

  pipe: {
    text: textPipe,
    arrayBuffer: arrayBufferPipe,
    compress: compressPipe,
    decompress: decompressPipe,
    map: mapPipe,
    each: eachPipe,
    filter: filterPipe,
    split: splitPipe,
    join: joinPipe,
    slice: slicePipe,
    cut: cutPipe,
    percent: percentPipe,
    pressure: pressurePipe,
  },
}

stream.source.array = arraySource
stream.source.iterator = iteratorSource
stream.sink.each = eachSink

export default stream
