// @related https://github.com/dominictarr/event-stream
// @read https://web.dev/streams/
// @read https://wicg.github.io/compression/
// @read https://github.com/openpgpjs/web-stream-tools
// @read https://whatwg-stream-visualizer.glitch.me/
// @read https://web.dev/websocketstream/
// @read https://github.com/SocketDev/wormhole-crypto
// @read https://github.com/surma/observables-with-streams

if ("DecompressionStream" in globalThis === false) {
  await import("./env/polyfills/globalThis.DecompressionStream.min.js")
}

import combine from "../fabric/type/typedarray/combine.js"
import nextCycle from "../fabric/type/promise/nextCycle.js"
import sleep from "../fabric/type/promise/sleep.js"

import pump from "./stream/pump.js"
export { default as pump } from "./stream/pump.js"

import absorb from "./stream/absorb.js"
export { default as absorb } from "./stream/absorb.js"

/* readable
=========== */

export function rsArray(data, queuingStrategy) {
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
    queuingStrategy
  )
}

export function rsSource(data, queuingStrategy) {
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
      queuingStrategy
    )
  }

  // TODO: fix stream polyfill to allow use of Response.body
  // return new Response(data).body
  return new Blob([data]).stream()
}

export function rsWrap(stream, { before, after }, queuingStrategy) {
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
    queuingStrategy
  )
}

export function rsIterator(iterator, queuingStrategy) {
  return new ReadableStream(
    {
      async pull(controller) {
        const { value, done } = await iterator.next()
        if (done) controller.close()
        else controller.enqueue(value)
      },
    },
    queuingStrategy
  )
}

export async function rsTee(rs, fn) {
  const x = await fn(...rs.tee())
  return Array.isArray(x) ? Promise.all(x) : undefined
}

/* writable
=========== */

export async function wsCollect(rs, encoding = "auto") {
  const buffer = absorb(encoding)
  await rs.pipeTo(new WritableStream({ write: (chunk) => buffer.add(chunk) }))
  return buffer.value
}

export function wsSink(cb, encoding = "auto") {
  if (typeof cb !== "function") return new WritableStream()
  const buffer = absorb(encoding)
  return new WritableStream({
    write: (chunk) => buffer.add(chunk),
    close: () => cb(buffer.value),
  })
}

export async function wsSample(rs, fn) {
  const [a, b] = rs.tee()
  fn(a)
  return wsCollect(b)
}

export function wsEach(cb) {
  let i = 0
  const ws = new WritableStream({
    async write(chunk, controller) {
      const res = await cb(chunk, i++)
      if (res === false) controller.error()
    },
  })
  return ws
}

/* transform
============ */

const DEFAULT_WATERMARK = [{ highWaterMark: 1 }, { highWaterMark: 0 }]

export function tsText(encoding) {
  return new TextDecoderStream(encoding)
}

export function tsArrayBuffer(encoding) {
  return new TextEncoderStream(encoding)
}

export function tsCompress(type = "gzip") {
  return new CompressionStream(type)
}

export function tsDecompress(type = "gzip") {
  return new DecompressionStream(type)
}

export function tsJSON() {
  return new TransformStream(
    {
      transform(chunk, controller) {
        controller.enqueue(JSON.parse(chunk))
      },
    },
    ...DEFAULT_WATERMARK
  )
}

// @src https://github.com/jakearchibald/streaming-html-spec/blob/master/ParseTransform.js
// Apache License 2.0
// TODO: test using document.implementation.createHTMLDocument()
export function tsDOM() {
  let controller
  // Create iframe for piping the response
  const iframe = document.createElement("iframe")
  iframe.style.display = "none"
  document.body.append(iframe)

  // Give the iframe a body
  iframe.contentDocument.write("<!DOCTYPE html><body>")

  function queueChildNodes() {
    for (const node of iframe.contentDocument.body.childNodes) {
      node.remove()
      controller.enqueue(node)
    }
  }

  const observer = new MutationObserver(() => queueChildNodes())

  observer.observe(iframe.contentDocument.body, {
    childList: true,
  })

  return new TransformStream(
    {
      start(c) {
        controller = c
      },
      transform(chunk) {
        iframe.contentDocument.write(chunk)
      },
      flush() {
        queueChildNodes()
        iframe.contentDocument.close()
        iframe.remove()
      },
    },
    ...DEFAULT_WATERMARK
  )
}

export function tsMap(cb) {
  let i = 0
  return new TransformStream(
    {
      async transform(chunk, controller) {
        controller.enqueue(await cb(chunk, i++))
      },
    },
    ...DEFAULT_WATERMARK
  )
}

export function tsEach(cb) {
  let i = 0
  return new TransformStream(
    {
      async transform(chunk, controller) {
        await cb(chunk, i++)
        controller.enqueue(chunk)
      },
    },
    ...DEFAULT_WATERMARK
  )
}

export function tsFilter(cb) {
  return new TransformStream(
    {
      async transform(chunk, controller) {
        if (await cb(chunk)) controller.enqueue(chunk)
      },
    },
    ...DEFAULT_WATERMARK
  )
}

export function tsSplit(delimiter = "\n", options) {
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
    ...DEFAULT_WATERMARK
  )
}

export function tsJoin(delimiter = "\n") {
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
    ...DEFAULT_WATERMARK
  )
}

export function tsCut(size, options) {
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
                controller.enqueue(combine(prevArr, chunk.slice(0, i)))
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
    { highWaterMark: 1 },
    { highWaterMark: 0 }
  )
}

export function tsPercent(total, cb) {
  let bytes = 0
  return new TransformStream(
    {
      transform(chunk, controller) {
        bytes += chunk.length
        cb((100 * bytes) / total, bytes, total)
        controller.enqueue(chunk)
      },
    },
    ...DEFAULT_WATERMARK
  )
}

export function tsPressure(fn = nextCycle) {
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
    ...DEFAULT_WATERMARK
  )
}

export function tsCombine(a, ...transforms) {
  if (Array.isArray(a)) [a, ...transforms] = a
  let readable = a.readable || a
  transforms.forEach((transform) => {
    readable = readable.pipeThrough(transform)
  })
  return a.writable ? { writable: a.writable, readable } : readable
}

const stream = {
  pump,
  absorb,

  readable: {
    array: rsArray,
    source: rsSource,
    iterator: rsIterator,
    wrap: rsWrap,
    tee: rsTee,
  },

  writable: {
    collect: wsCollect,
    sink: wsSink,
    sample: wsSample,
    each: wsEach,
  },

  transform: {
    text: tsText,
    arrayBuffer: tsArrayBuffer,
    compress: tsCompress,
    decompress: tsDecompress,
    json: tsJSON,
    dom: tsDOM,
    map: tsMap,
    each: tsEach,
    filter: tsFilter,
    split: tsSplit,
    join: tsJoin,
    cut: tsCut,
    percent: tsPercent,
    pressure: tsPressure,
    combine: tsCombine,
  },
}

stream.rs = stream.readable
stream.ws = stream.writable
stream.ts = stream.transform

export default stream
