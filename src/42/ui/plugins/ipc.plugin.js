/* eslint-disable camelcase */
import inIframe from "../../core/env/runtime/inIframe.js"
import inTop from "../../core/env/runtime/inTop.js"
import ipc from "../../core/ipc.js"
import allocate from "../../fabric/locator/allocate.js"
import configure from "../../core/configure.js"

let debug = 0

let cnt = 0
const max = 30

if (debug) {
  document.addEventListener("click", () => {
    console.log("////////////////////////////")
  })

  debug = (message) => {
    console.log(message)
    if (cnt++ > max) throw new Error("maximum ipc debug call")
  }
} else debug = undefined

const DEFAULTS = {
  parent_iframe_to_top: true,
  top_to_parent_iframe: true,
  parent_top_to_iframe: true,
  iframe_to_parent_top: true,
}

function getData(queue, ctx) {
  const data = {}
  for (const key of queue) {
    if (key.startsWith("/ui-")) continue
    const val = ctx.reactive.get(key, { silent: true })
    if (val !== undefined) allocate(data, key, val, "/")
  }

  return data
}

const iframes = new Map()

if (inTop) {
  ipc
    .on("42-ui-ipc-handshake", (data, { iframe, emit }) =>
      iframes.set(iframe, emit)
    )
    .on("42-ui-ipc-close", (data, { iframe }) => {
      iframes.delete(iframe)
    })
}

if (inIframe) {
  ipc.to.top.emit("42-ui-ipc-handshake")
  globalThis.addEventListener("pagehide", () =>
    ipc.to.top.emit("42-ui-ipc-close")
  )
}

export default async function ipcPlugin(ctx, options) {
  if (ctx.plugins.ipc) return
  ctx.plugins.ipc = true

  const {
    parent_iframe_to_top, //
    top_to_parent_iframe,
    parent_top_to_iframe,
    iframe_to_parent_top,
  } = configure(DEFAULTS, options)

  // Parent Iframe --> Top

  if (parent_iframe_to_top) {
    if (inTop && ctx.parentId) {
      ipc.on(`42-ui-ipc-${ctx.parentId}`, ctx, (data) => {
        debug?.("Parent Iframe --> Top")
        ctx.reactive.merge("/", data)
      })
    }

    if (inIframe) {
      ctx.reactive.on("update", ctx, (queue) => {
        ipc.to.top.emit(`42-ui-ipc-${ctx.id}`, getData(queue, ctx))
      })
    }
  }

  // Top --> Parent Iframe

  if (top_to_parent_iframe) {
    if (inTop && ctx.parentId) {
      ctx.reactive.on("update", ctx, (queue) => {
        const data = getData(queue, ctx)
        for (const emit of iframes.values()) {
          emit(`42-ui-ipc-${ctx.parentId}`, data)
        }
      })
    }

    if (inIframe) {
      ipc.to.top.on(`42-ui-ipc-${ctx.id}`, ctx, (data) => {
        debug?.("Top --> Parent Iframe")
        ctx.reactive.merge("/", data)
      })
    }
  }

  // Parent Top --> Iframe

  if (parent_top_to_iframe) {
    if (inTop) {
      ctx.reactive.on("update", ctx, (queue) => {
        const data = getData(queue, ctx)
        for (const emit of iframes.values()) {
          emit(`42-ui-ipc-${ctx.id}`, data)
        }
      })
    }

    if (inIframe) {
      ipc.to.top.on(`42-ui-ipc-${ctx.parentId}`, ctx, (data) => {
        debug?.("Parent Top --> Iframe")
        ctx.reactive.merge("/", data)
      })
    }
  }

  // Iframe --> Parent Top

  if (iframe_to_parent_top) {
    if (inTop) {
      ipc.on(`42-ui-ipc-${ctx.id}`, ctx, (data) => {
        debug?.("Iframe --> Parent Top")
        ctx.reactive.merge("/", data)
      })
    }

    if (inIframe) {
      ctx.reactive.on("update", ctx, (queue) => {
        ipc.to.top.emit(`42-ui-ipc-${ctx.parentId}`, getData(queue, ctx))
      })
    }
  }
}
