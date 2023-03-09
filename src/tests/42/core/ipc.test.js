import test from "../../../42/test.js"
import ipc from "../../../42/core/ipc.js"
import ui from "../../../42/ui.js"
import timeout from "../../../42/fabric/type/promise/timeout.js"

test.suite.serial()

const check = {
  iframe: 1,
  sandbox: 1,
  childWindow: 1,
  dedicatedWorker: 1,
  sharedWorker: 1,
  serviceWorker: 1,
}

if (test.env.browser.isFirefox) {
  // TODO: check firefox compatibility with worker modules
  // https://caniuse.com/mdn-api_worker_worker_ecmascript_modules
  check.dedicatedWorker = 0
  check.sharedWorker = 0
  check.serviceWorker = 0
}

const realm = {
  inChildWindow: false,
  inDedicatedWorker: false,
  inIframe: false,
  inOpaqueOrigin: false,
  inServiceWorker: false,
  inSharedWorker: false,
  inTop: false,
  inWindow: false,
  inWorker: false,
}

const realms = {
  top: {
    ...realm,
    inTop: true,
    inWindow: true,
  },
  iframe: {
    ...realm,
    inIframe: true,
    inWindow: true,
  },
  sandbox: {
    ...realm,
    inIframe: true,
    inOpaqueOrigin: true,
    inWindow: true,
  },
  childWindow: {
    ...realm,
    inChildWindow: true,
    inTop: true,
    inWindow: true,
  },
  dedicatedWorker: {
    ...realm,
    inDedicatedWorker: true,
    inWorker: true,
  },
  sharedWorker: {
    ...realm,
    inSharedWorker: true,
    inWorker: true,
  },
  serviceWorker: {
    ...realm,
    inServiceWorker: true,
    inWorker: true,
  },
}

const runtime = {
  inAutomated: false,
  inBackend: false,
  inBrowser: false,
  inDeno: false,
  inElectron: false,
  inFrontend: false,
  inNode: false,
  inPWA: false,
}

const view = {
  ...runtime,
  inBrowser: true,
  inFrontend: true,
}

const worker = {
  ...runtime,
  inFrontend: true,
}

const contexts = {
  iframe(t, { decay, dest }) {
    return decay(
      ui(
        dest({ connect: true }),
        {
          tag: "iframe",
          src: "/tests/fixtures/ipc/emit.html?e=42_ENV_IFRAME",
        },
        { trusted: true }
      )
    )
  },

  sandbox(t, { decay, dest }) {
    return decay(
      ui(dest({ connect: true }), {
        tag: "ui-sandbox",
        permissions: "app",
        path: "/tests/fixtures/ipc/emit.html?e=42_ENV_SANDBOX",
      })
    )
  },

  async childWindow(t, { decay }) {
    const target = window.open(
      "/tests/fixtures/ipc/emit.html?e=42_ENV_CHILDWINDOW",
      "_blank"
    )
    decay(target)
    await t.utils.nextCycle()
    window.focus()
    return target
  },

  dedicatedWorker(t, { decay }) {
    const target = new Worker(
      "/tests/fixtures/ipc/emit.js?e=42_ENV_DEDICATEDWORKER",
      { type: "module" }
    )
    decay(ipc.from(target))
    decay(target)
    return target
  },

  sharedWorker(t, { decay }) {
    const target = new SharedWorker(
      "/tests/fixtures/ipc/emit.js?e=42_ENV_SHAREDWORKER",
      { type: "module" }
    )
    decay(ipc.from(target))
    decay(target.port)
    return target
  },

  async serviceWorker(t, { decay }) {
    const registration = await navigator.serviceWorker.register(
      "/tests/fixtures/ipc/emit.js?e=42_ENV_SERVICEWORKER",
      { type: "module" }
    )
    decay(registration)
    return registration
  },
}

for (const [key, val] of Object.entries(check)) {
  if (!val) continue
  test.serial(key, "emit", async (t, utils) => {
    const ctx = contexts[key]

    const emitted = Promise.race([
      timeout(1900, `${key} timed out`),
      new Promise((resolve) =>
        ipc.on(`42_ENV_${key.toUpperCase()}`, (data) => {
          if (key === "childWindow") ctx.target.close()
          t.timeout("reset")
          resolve(data)
        })
      ),
    ])

    ctx.target = await ctx(t, utils)
    const res = await emitted

    t.alike(res.runtime, key.endsWith("Worker") ? worker : view)
    t.alike(res.realm, realms[key])
  })
}
