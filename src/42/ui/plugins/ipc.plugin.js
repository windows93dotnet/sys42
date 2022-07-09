import inIframe from "../../system/env/runtime/inIframe.js"
import inTop from "../../system/env/runtime/inTop.js"
import ipc from "../../system/ipc.js"
import allocate from "../../fabric/locator/allocate.js"
import configure from "../../fabric/configure.js"

const DEFAULTS = {
  upstream: true,
  downstream: true,
}

export default async (ctx, options) => {
  const { upstream } = configure(DEFAULTS, options)

  if (upstream) {
    if (inTop && ctx.parentId) {
      ipc.on(`42-ui-ipc-${ctx.parentId}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }

    if (inIframe) {
      const bus = ipc.to(globalThis.top)

      ctx.reactive.on("update", (queue) => {
        const data = {}
        for (const key of queue) allocate(data, key, ctx.reactive.get(key), "/")
        bus.send(`42-ui-ipc-${ctx.id}`, data)
      })
    }
  }
}
