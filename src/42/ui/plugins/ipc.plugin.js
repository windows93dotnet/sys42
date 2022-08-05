/* eslint-disable camelcase */
import inIframe from "../../core/env/runtime/inIframe.js"
import inTop from "../../core/env/runtime/inTop.js"
import ipc from "../../core/ipc.js"
import configure from "../../core/configure.js"

let debug = 1

let cnt = 0
const max = 300

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
      ipc.on(`42-ui-ipc-${ctx.parentId}`, ctx, (data, { iframe }) => {
        debug?.("Parent Iframe --> Top")
        ctx.reactive.import(data, iframe)
      })
    }

    if (inIframe) {
      ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
        console.log(source)
        ipc.to.top.emit(
          `42-ui-ipc-${ctx.id}`,
          ctx.reactive.export(changes, deleteds)
        )
      })
    }
  }

  // Top --> Parent Iframe

  if (top_to_parent_iframe) {
    if (inTop && ctx.parentId) {
      ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
        const data = ctx.reactive.export(changes, deleteds)
        for (const [iframe, emit] of iframes.entries()) {
          if (iframe !== source) emit(`42-ui-ipc-${ctx.parentId}`, data)
        }
      })
    }

    if (inIframe) {
      ipc.to.top.on(`42-ui-ipc-${ctx.id}`, ctx, (data) => {
        debug?.("Top --> Parent Iframe")
        ctx.reactive.import(data)
      })
    }
  }

  // Parent Top --> Iframe

  if (parent_top_to_iframe) {
    if (inTop) {
      ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
        const data = ctx.reactive.export(changes, deleteds)
        for (const [iframe, emit] of iframes.entries()) {
          if (iframe !== source) emit(`42-ui-ipc-${ctx.id}`, data)
        }
      })
    }

    if (inIframe) {
      ipc.to.top.on(`42-ui-ipc-${ctx.parentId}`, ctx, (data) => {
        debug?.("Parent Top --> Iframe")
        ctx.reactive.import(data)
      })
    }
  }

  // Iframe --> Parent Top

  if (iframe_to_parent_top) {
    if (inTop) {
      ipc.on(`42-ui-ipc-${ctx.id}`, ctx, (data, { iframe }) => {
        debug?.("Iframe --> Parent Top")
        ctx.reactive.import(data, iframe)
      })
    }

    if (inIframe) {
      ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
        console.log(source)
        ipc.to.top.emit(
          `42-ui-ipc-${ctx.parentId}`,
          ctx.reactive.export(changes, deleteds)
        )
      })
    }
  }
}
