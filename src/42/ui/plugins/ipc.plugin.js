import system from "../../system.js"
import inIframe from "../../core/env/realm/inIframe.js"
import inTop from "../../core/env/realm/inTop.js"
import ipc from "../../core/ipc.js"

/* <DEV> */
import debounce from "../../fabric/type/function/debounce.js"

let debug = 0

let endOfUpdate

if (system.DEV) {
  endOfUpdate = debounce(() => {
    system.emit("ipc.plugin:end-of-update")
  }, 30)
}

if (debug) {
  let cnt = 0
  const max = 100

  if (debug > 1) {
    document.addEventListener("click", () => {
      console.log(`------------- click ${inTop ? "inTop" : "inIframe"}`)
    })
  }

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
/* </DEV> */

export default async function ipcPlugin(ctx) {
  if (ctx.plugins.ipc) return
  ctx.plugins.ipc = true

  if (inTop) {
    ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
      const data = ctx.reactive.export(changes, deleteds)
      for (const { iframe, emit } of ipc.iframes.values()) {
        if (iframe !== source) {
          // Parent Top --> Iframe
          emit(`42-ui-ipc-${ctx.id}`, data)
          // Top --> Parent Iframe
          if (ctx.initiator) emit(`42-ui-ipc-${ctx.initiator}`, data)
        }
      }
    })

    // Parent Top <-- Iframe
    ipc.on(`42-ui-ipc-${ctx.id}`, ctx, (data, { iframe }) => {
      ctx.reactive.import(data, iframe)
      debug?.("Parent Top <-- Iframe")
    })

    if (ctx.initiator) {
      // Top <-- Parent Iframe
      ipc.on(`42-ui-ipc-${ctx.initiator}`, ctx, (data, { iframe }) => {
        ctx.reactive.import(data, iframe)
        debug?.("Top <-- Parent Iframe")
      })
    }
  }

  if (inIframe) {
    ctx.reactive.on("update", ctx, (changes, deleteds, source) => {
      const data = ctx.reactive.export(changes, deleteds)

      // Parent Iframe --> Top
      ipc.emit(`42-ui-ipc-${ctx.id}`, data)

      // Iframe --> Parent Top
      if (source !== "parent" && ctx.initiator) {
        ipc.emit(`42-ui-ipc-${ctx.initiator}`, data)
      }
    })

    // Parent Iframe <-- Top
    ipc.on(`42-ui-ipc-${ctx.id}`, ctx, (data) => {
      ctx.reactive.import(data)
      debug?.("Parent Iframe <-- Top")
    })

    if (ctx.initiator) {
      // Iframe <-- Parent Top
      ipc.on(`42-ui-ipc-${ctx.initiator}`, ctx, (data) => {
        ctx.reactive.import(data, "parent")
        debug?.("Iframe <-- Parent Top")
      })
    }
  }
}
