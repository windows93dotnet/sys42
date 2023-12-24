import system from "../../system.js"
import inIframe from "../../core/env/realm/inIframe.js"
import inTop from "../../core/env/realm/inTop.js"
import ipc from "../../core/ipc.js"
import noop from "../../fabric/type/function/noop.js"
import debounce from "../../fabric/type/function/debounce.js"

let endOfUpdate
if (system.DEV) {
  endOfUpdate = debounce((message) => {
    system.emit("ipc.plugin:end-of-update", message)
  }, 30)
}

/* <DEV> */
let debug = 0

if (debug) {
  let cnt = 0
  const max = 100
  const verbose = debug

  debug = (message, level = 1) => {
    endOfUpdate?.(message)
    if (verbose >= level) console.log(message)
    if (cnt++ > max) throw new Error("Maximum ipc debug call")
  }

  debug.verbose = verbose
} else if (endOfUpdate) {
  debug = endOfUpdate
} else {
  debug = noop
}
/* </DEV> */

const watchedDetachedSignals = new WeakSet()

export default async function ipcPlugin(stage) {
  const controller = new AbortController()
  const { signal } = controller
  const options = { signal }

  // signal.addEventListener("abort", () => {
  //   console.log("ipcPlugin abort:", signal.reason?.message)
  // })

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
          emit(`42-ui-ipc-${stage.id}`, data)
          debug("Parent Top --> Iframe", 2)

          if (stage.initiator) {
            emit(`42-ui-ipc-${stage.initiator}`, data)
            debug("Top --> Parent Iframe", 2)
          }
        }
      }
    })

    ipc.on(`42-ui-ipc-${stage.id}`, options, (data, { iframe }) => {
      stage.reactive.import(data, iframe)
      debug("Parent Top <-- Iframe")
    })

    ipc.on(`42-ui-ipc-handshake-${stage.id}`, options, (data) => {
      if (stage.sandboxes.has(data)) {
        stage.sandboxes.get(data).resolve()
      }

      return stage.reactive.export()
    })

    if (stage.initiator) {
      ipc.on(`42-ui-ipc-${stage.initiator}`, options, (data, { iframe }) => {
        stage.reactive.import(data, iframe)
        debug("Top <-- Parent Iframe")
      })
    }
  }

  if (inIframe) {
    stage.reactive.on("update", options, (changes, deleteds, source) => {
      const data = stage.reactive.export(changes, deleteds)

      ipc.emit(`42-ui-ipc-${stage.id}`, data)
      debug("Parent Iframe --> Top", 2)

      if (source !== "parent" && stage.initiator) {
        ipc.emit(`42-ui-ipc-${stage.initiator}`, data)
        debug("Iframe --> Parent Top", 2)
      }
    })

    ipc.on(`42-ui-ipc-${stage.id}`, options, (data) => {
      stage.reactive.import(data)
      debug("Parent Iframe <-- Top")
    })

    if (stage.initiator) {
      ipc.on(`42-ui-ipc-${stage.initiator}`, options, (data) => {
        stage.reactive.import(data, "parent")
        debug("Iframe <-- Parent Top")
      })

      ipc
        .send(`42-ui-ipc-handshake-${stage.initiator}`, stage.id)
        .then((data) => {
          stage.reactive.import(data, "parent")
        })
    }
  }
}
