import system from "../../system.js"
import inIframe from "../../core/env/realm/inIframe.js"
import inTop from "../../core/env/realm/inTop.js"
import ipc from "../../core/ipc.js"
import debounce from "../../fabric/type/function/debounce.js"

let debug = 0

let endOfUpdate
if (system.DEV && inTop) {
  endOfUpdate = debounce(() => {
    system.emit("ipc.plugin:end-of-update")
  }, 30)
}

if (debug) {
  let cnt = 0
  const max = 100

  document.addEventListener("click", () => {
    console.log(`---------------------- click ${inTop ? "inTop" : "inIframe"}`)
  })

  debug = (message) => {
    endOfUpdate?.()
    console.log(message)
    if (cnt++ > max) throw new Error("maximum ipc debug call")
  }
} else if (endOfUpdate) {
  debug = endOfUpdate
} else {
  debug = undefined
}

export default async function ipcPlugin(ctx) {
  if (ctx.plugins.ipc) return
  ctx.plugins.ipc = true

  if (inTop) {
    // Parent Top --> Iframe
    ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
      const data = ctx.reactive.export(changes, deleteds)
      for (const { iframe, emit } of ipc.iframes.values()) {
        if (iframe !== source) emit(`42-ui-ipc-${ctx.id}`, data)
      }
    })
    // Parent Top <-- Iframe
    ipc.on(`42-ui-ipc-${ctx.id}`, ctx, (data, { iframe }) => {
      debug?.("Parent Top <-- Iframe")
      ctx.reactive.import(data, iframe)
    })

    if (ctx.parentId) {
      // Top <-- Parent Iframe
      ipc.on(`42-ui-ipc-${ctx.parentId}`, ctx, (data, { iframe }) => {
        debug?.("Top <-- Parent Iframe")
        ctx.reactive.import(data, iframe)
      })
      // Top --> Parent Iframe
      ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
        const data = ctx.reactive.export(changes, deleteds)
        for (const { iframe, emit } of ipc.iframes.values()) {
          if (iframe !== source) emit(`42-ui-ipc-${ctx.parentId}`, data)
        }
      })
    }
  }

  if (inIframe) {
    // Parent Iframe --> Top
    ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
      if (source === "top") return
      ipc.to.top.emit(
        `42-ui-ipc-${ctx.id}`,
        ctx.reactive.export(changes, deleteds)
      )
    })
    // Parent Iframe <-- Top
    ipc.to.top.on(`42-ui-ipc-${ctx.id}`, ctx, (data) => {
      debug?.("Parent Iframe <-- Top")
      ctx.reactive.import(data, "top")
    })

    if (ctx.parentId) {
      // Iframe <-- Parent Top
      ipc.to.top.on(`42-ui-ipc-${ctx.parentId}`, ctx, (data) => {
        debug?.("Iframe <-- Parent Top")
        ctx.reactive.import(data, "parent")
      })
      // Iframe --> Parent Top
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
