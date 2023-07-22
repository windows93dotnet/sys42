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

const watchedDetachedSignals = new WeakSet()

export default async function ipcPlugin(stage) {
  const controller = new AbortController()
  const { signal } = controller
  const options = { signal }

  // if (debug) {
  //   signal.addEventListener("abort", () => {
  //     console.log("ipcPlugin abort:", signal.reason?.message)
  //   })
  // }

  const checkDetacheds = ({ target }) => {
    for (const detached of stage.detacheds) {
      if (watchedDetachedSignals.has(detached)) continue
      watchedDetachedSignals.add(detached)
      detached.stage.signal.addEventListener("abort", checkDetacheds)
    }

    // Abort only if no components are detached
    if (stage.detacheds.size === 0) controller.abort(target?.reason)
  }

  stage.signal.addEventListener("abort", checkDetacheds)

  if (inTop) {
    stage.reactive.on("update", options, (changes, deleteds, source) => {
      const data = stage.reactive.export(changes, deleteds)
      for (const { iframe, emit } of ipc.iframes.values()) {
        if (iframe !== source) {
          // Parent Top --> Iframe
          emit(`42-ui-ipc-${stage.id}`, data)
          // Top --> Parent Iframe
          if (stage.initiator) emit(`42-ui-ipc-${stage.initiator}`, data)
        }
      }
    })

    // Parent Top <-- Iframe
    ipc.on(`42-ui-ipc-${stage.id}`, options, (data, { iframe }) => {
      stage.reactive.import(data, iframe)
      debug?.("Parent Top <-- Iframe")
    })

    if (stage.initiator) {
      // Top <-- Parent Iframe
      ipc.on(`42-ui-ipc-${stage.initiator}`, options, (data, { iframe }) => {
        stage.reactive.import(data, iframe)
        debug?.("Top <-- Parent Iframe")
      })
    }
  }

  if (inIframe) {
    stage.reactive.on("update", options, (changes, deleteds, source) => {
      const data = stage.reactive.export(changes, deleteds)

      // Parent Iframe --> Top
      ipc.emit(`42-ui-ipc-${stage.id}`, data)

      // Iframe --> Parent Top
      if (source !== "parent" && stage.initiator) {
        ipc.emit(`42-ui-ipc-${stage.initiator}`, data)
      }
    })

    // Parent Iframe <-- Top
    ipc.on(`42-ui-ipc-${stage.id}`, options, (data) => {
      stage.reactive.import(data)
      debug?.("Parent Iframe <-- Top")
    })

    if (stage.initiator) {
      // Iframe <-- Parent Top
      ipc.on(`42-ui-ipc-${stage.initiator}`, options, (data) => {
        stage.reactive.import(data, "parent")
        debug?.("Iframe <-- Parent Top")
      })
    }
  }
}
