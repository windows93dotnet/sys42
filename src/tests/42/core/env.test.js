import test from "../../../42/test.js"
import env from "../../../42/core/env.js"
import ui from "../../../42/ui.js"

const code = `
// import ipc from "../../../42/core/ipc.js"
// import env from "../../../42/core/env.js"
import noop from "/42/fabric/type/function/noop.js"
console.log(888, noop)
// ipc.to.parent.emit("42_ENV_TEST", env)
`

test(1, async (t, { collect, dest }) => {
  const app = await collect(
    ui(
      dest(true),
      [
        {
          tag: "iframe",
          srcdoc: `<script>console.log(444)</script>`,
        },
      ],
      { trusted: true }
    )
  )

  const blob = new Blob([code], { type: "application/javascript" })
  const worker = new Worker(URL.createObjectURL(blob), { type: "module" })

  worker.addEventListener("error", (e) => {
    console.log(e)
  })

  t.alike(env.runtime, {
    inAutomated: false,
    inBackend: false,
    inBrowser: true,
    inDeno: false,
    inElectron: false,
    inFrontend: true,
    inNode: false,
    inStandalone: false,
  })

  t.alike(env.realm, {
    inChildWindow: false,
    inDedicatedWorker: false,
    inIframe: false,
    inOpaqueOrigin: false,
    inServiceWorker: false,
    inSharedWorker: false,
    inTop: true,
    inView: true,
    inWindow: true,
    inWorker: false,
  })
})
