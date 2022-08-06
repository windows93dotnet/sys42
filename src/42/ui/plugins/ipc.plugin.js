/* eslint-disable camelcase */
import system from "../../system.js"
import inIframe from "../../core/env/runtime/inIframe.js"
import inTop from "../../core/env/runtime/inTop.js"
import ipc from "../../core/ipc.js"
import configure from "../../core/configure.js"
import debounce from "../../fabric/type/function/debounce.js"

let debug = 0

let emitEnd
if (system.DEV && inTop) {
  emitEnd = debounce(() => {
    system.emit("ipc.plugin:end")
  }, 30)
}

if (debug) {
  let cnt = 0
  const max = 100

  document.addEventListener("click", () => {
    console.log(`---------------------- click ${inTop ? "inTop" : "inIframe"}`)
  })

  debug = (message) => {
    emitEnd?.()
    console.log(message)
    if (cnt++ > max) throw new Error("maximum ipc debug call")
  }
} else if (emitEnd) {
  debug = emitEnd
} else {
  debug = undefined
}

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
        if (source === "top") return
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
        ctx.reactive.import(data, "top")
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
        ctx.reactive.import(data, "parent")
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
        if (source === "parent") return
        ipc.to.top.emit(
          `42-ui-ipc-${ctx.parentId}`,
          ctx.reactive.export(changes, deleteds)
        )
      })
    }
  }
}
