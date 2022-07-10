import inIframe from "../../system/env/runtime/inIframe.js"
import inTop from "../../system/env/runtime/inTop.js"
import ipc from "../../system/ipc.js"
import allocate from "../../fabric/locator/allocate.js"
import configure from "../../fabric/configure.js"

const DEFAULTS = {
  upstream: true,
  downstream: true,
}

function getData(queue, ctx) {
  const data = {}
  for (const key of queue) allocate(data, key, ctx.reactive.get(key), "/")
  return data
}

export default async (ctx, options) => {
  const { upstream, downstream } = configure(DEFAULTS, options)

  if (upstream) {
    if (inTop && ctx.parentId) {
      ipc.on(`42-ui-ipc-${ctx.parentId}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }

    if (inIframe) {
      const bus = ipc.to(globalThis.top)

      ctx.reactive.on("update", (queue) => {
        bus.send(`42-ui-ipc-${ctx.id}`, getData(queue, ctx))
      })
    }
  }

  if (downstream) {
    if (inTop) {
      const senders = []

      ipc.on("42-ui-ipc-handshake", (data, meta) => {
        senders.push(meta.send)
      })

      ctx.reactive.on("update", (queue) => {
        const data = getData(queue, ctx)
        for (const send of senders) send(`42-ui-ipc-${ctx.id}`, data)
      })
    }

    if (inIframe) {
      ipc
        .to(globalThis.top)
        .on(`42-ui-ipc-${ctx.parentId}`, (data) => {
          ctx.reactive.assign("/", data)
        })
        .send("42-ui-ipc-handshake")
    }
  }
}
