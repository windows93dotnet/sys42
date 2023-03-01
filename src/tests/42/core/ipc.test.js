/* eslint-disable no-implicit-coercion */
import test from "../../../42/test.js"
import env from "../../../42/core/env.js"
import ipc from "../../../42/core/ipc.js"
import ui from "../../../42/ui.js"
import timeout from "../../../42/fabric/type/promise/timeout.js"

test.suite.serial()

const check = {
  iframe: 1,
  sandbox: 1,
  childWindow: 0, // [1]
  dedicatedWorker: 1,
  sharedWorker: 0, // [1]
  serviceWorker: 0, // [1]
}

// [1] Can make the browser crash on reload

if (test.env.browser.isFirefox) {
  // TODO: check firefox compatibility with worker modules
  // https://caniuse.com/mdn-api_worker_worker_ecmascript_modules
  check.dedicatedWorker = 0
  check.sharedWorker = 0
  check.serviceWorker = 0
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

test("env", "keys", (t) => {
  t.eq(Object.keys(env), expectedKeys)
  t.eq(Object.keys(structuredClone(env)), expectedKeys)
  t.eq(Object.keys(JSON.parse(JSON.stringify(env))), expectedKeys)
})

test("env", "toPrimitive", (t) => {
  t.true(String(env).includes(" on "))
  t.true((env + "").includes(" on "))
  t.true((env + 2).includes(" on "))
  t.true((env + 2).endsWith("2"))
  t.isNaN(Number(env))
  t.isNaN(+env)
})

test.serial("realms", async (t, { decay, dest }) => {
  t.timeout(2000)

  const targets = {}

  const list = Object.entries(check).map(([key, val]) => {
    if (!val) return
    return Promise.race([
      timeout(1900, `${key} timed out`),
      new Promise((resolve) =>
        ipc.on(`42_ENV_${key.toUpperCase()}`, (data) => {
          if (key === "childWindow") targets.childWindow.close()
          t.timeout("reset")
          resolve(data)
        })
      ),
    ])
  })

  if (check.iframe || check.sandbox) {
    await decay(
      ui(
        dest({ connect: true }),
        [
          check.iframe && {
            tag: "iframe",
            src: "/tests/fixtures/ipc/rsvp.html?e=42_ENV_IFRAME",
          },
          check.sandbox && {
            tag: "ui-sandbox",
            permissions: "app",
            path: "/tests/fixtures/ipc/rsvp.html?e=42_ENV_SANDBOX",
          },
        ],
        { trusted: true }
      )
    )
  }

  if (check.childWindow) {
    targets.childWindow = window.open(
      "/tests/fixtures/ipc/rsvp.html?e=42_ENV_CHILDWINDOW",
      "_blank"
    )
    decay(targets.childWindow)
    await t.utils.nextCycle()
    window.focus()
  }

  if (check.dedicatedWorker) {
    targets.dedicatedWorker = new Worker(
      "/tests/fixtures/ipc/rsvp.js?e=42_ENV_DEDICATEDWORKER",
      { type: "module" }
    )
    decay(ipc.from(targets.dedicatedWorker))
    decay(targets.dedicatedWorker)
  }

  if (check.sharedWorker) {
    targets.sharedWorker = new SharedWorker(
      "/tests/fixtures/ipc/rsvp.js?e=42_ENV_SHAREDWORKER",
      { type: "module" }
    )
    decay(ipc.from(targets.sharedWorker))
    decay(targets.sharedWorker.port)
  }

  if (check.serviceWorker) {
    const registration = await navigator.serviceWorker.register(
      "/tests/fixtures/ipc/rsvp.js?e=42_ENV_SERVICEWORKER",
      { type: "module" }
    )
    decay(registration)
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
    serviceWorker: {
      inChildWindow: false,
      inDedicatedWorker: false,
      inIframe: false,
      inOpaqueOrigin: false,
      inServiceWorker: true,
      inSharedWorker: false,
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
    inPWA: false,
  }

  const worker = {
    inAutomated: false,
    inBackend: false,
    inBrowser: false,
    inDeno: false,
    inElectron: false,
    inFrontend: true,
    inNode: false,
    inPWA: false,
  }

  t.alike(env.runtime, view)
  t.alike(env.realm, realms.top)

  const res = await Promise.all(list)

  Object.entries(check).forEach(([key, val], i) => {
    if (!val) return
    t.alike(res[i].runtime, key.endsWith("Worker") ? worker : view)
    t.alike(res[i].realm, realms[key])
  })
})
