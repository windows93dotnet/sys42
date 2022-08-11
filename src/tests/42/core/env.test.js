/* eslint-disable no-implicit-coercion */
import test from "../../../42/test.js"
import env from "../../../42/core/env.js"
import ipc from "../../../42/core/ipc.js"
import ui from "../../../42/ui.js"
import template from "../../../42/core/formats/template.js"
import timeout from "../../../42/fabric/type/promise/timeout.js"

test.suite.serial()

const code = template(`
import ipc from "../../../42/core/ipc.js"
import env from "../../../42/core/env.js"
ipc.to.top.emit("{{.}}", env)
`)

const check = {
  iframe: 1,
  sandbox: 1,
  childWindow: 0,
  dedicatedWorker: 1,
  sharedWorker: 1,
}

const expectedKeys = [
  "realm",
  "runtime",
  "browser",
  "engine",
  "os",
  "device",
  "cpu",
  "memory",
  "gpu",
  "network",
  "languages",
]

test("keys", (t) => {
  t.eq(Object.keys(env), expectedKeys)
  t.eq(Object.keys(structuredClone(env)), expectedKeys)
  t.eq(Object.keys(JSON.parse(JSON.stringify(env))), expectedKeys)
})

test("toPrimitive", (t) => {
  t.true(String(env).includes(" on "))
  t.true((env + "").includes(" on "))
  t.true((env + 2).includes(" on "))
  t.true((env + 2).endsWith("2"))
  t.isNaN(Number(env))
  t.isNaN(+env)
})

test.serial("realms", async (t, { collect, dest }) => {
  t.timeout(2000)

  const list = Object.entries(check).map(([key, val]) => {
    if (!val) return
    return Promise.race([
      timeout(1900, `${key} timed out`),
      new Promise((resolve) => ipc.on(`42_ENV_${key.toUpperCase()}`, resolve)),
    ])
  })

  await collect(
    ui(
      dest(true),
      [
        check.iframe && {
          tag: "iframe",
          srcdoc: `<script type="module">${code("42_ENV_IFRAME")}</script>`,
        },
        check.sandbox && {
          tag: "ui-sandbox",
          permissions: "app",
          script: code("42_ENV_SANDBOX"),
        },
      ],
      { trusted: true }
    )
  )

  if (check.childWindow) {
    const windowHandle = window.open(
      "/tests/fixtures/ipc/rsvp.html?event=42_ENV_CHILDWINDOW",
      "_blank"
    )
    collect(windowHandle)
  }

  if (check.dedicatedWorker) {
    const worker = new Worker(
      "/tests/fixtures/ipc/rsvp.js?event=42_ENV_DEDICATEDWORKER",
      { type: "module" }
    )
    collect(ipc.from(worker))
    collect(worker)
  }

  if (check.sharedWorker) {
    const worker = new SharedWorker(
      "/tests/fixtures/ipc/rsvp.js?event=42_ENV_SHAREDWORKER",
      { type: "module" }
    )

    collect(ipc.from(worker))
    collect(worker)
  }

  const realms = {
    top: {
      inChildWindow: false,
      inDedicatedWorker: false,
      inIframe: false,
      inOpaqueOrigin: false,
      inServiceWorker: false,
      inSharedWorker: false,
      inTop: true,
      inWindow: true,
      inWorker: false,
    },
    iframe: {
      inChildWindow: false,
      inDedicatedWorker: false,
      inIframe: true,
      inOpaqueOrigin: false,
      inServiceWorker: false,
      inSharedWorker: false,
      inTop: false,
      inWindow: true,
      inWorker: false,
    },
    sandbox: {
      inChildWindow: false,
      inDedicatedWorker: false,
      inIframe: true,
      inOpaqueOrigin: true,
      inServiceWorker: false,
      inSharedWorker: false,
      inTop: false,
      inWindow: true,
      inWorker: false,
    },
    childWindow: {
      inChildWindow: true,
      inDedicatedWorker: false,
      inIframe: false,
      inOpaqueOrigin: false,
      inServiceWorker: false,
      inSharedWorker: false,
      inTop: true,
      inWindow: true,
      inWorker: false,
    },
    dedicatedWorker: {
      inChildWindow: false,
      inDedicatedWorker: true,
      inIframe: false,
      inOpaqueOrigin: false,
      inServiceWorker: false,
      inSharedWorker: false,
      inTop: false,
      inWindow: false,
      inWorker: true,
    },
    sharedWorker: {
      inChildWindow: false,
      inDedicatedWorker: false,
      inIframe: false,
      inOpaqueOrigin: false,
      inServiceWorker: false,
      inSharedWorker: true,
      inTop: false,
      inWindow: false,
      inWorker: true,
    },
  }

  const view = {
    inAutomated: false,
    inBackend: false,
    inBrowser: true,
    inDeno: false,
    inElectron: false,
    inFrontend: true,
    inNode: false,
    inStandalone: false,
  }

  const worker = {
    inAutomated: false,
    inBackend: false,
    inBrowser: false,
    inDeno: false,
    inElectron: false,
    inFrontend: true,
    inNode: false,
    inStandalone: false,
  }

  t.alike(env.runtime, view)
  t.alike(env.realm, realms.top)

  const res = await Promise.all(list)

  Object.entries(check).forEach(([key, val], i) => {
    if (!val) return
    t.alike(res[i].runtime, key.includes("Worker") ? worker : view)
    t.alike(res[i].realm, realms[key])
  })
})
