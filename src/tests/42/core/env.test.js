/* eslint-disable no-implicit-coercion */
import test from "../../../42/test.js"
import env from "../../../42/core/env.js"
import ipc from "../../../42/core/ipc.js"
import ui from "../../../42/ui.js"
import template from "../../../42/core/formats/template.js"
import timeout from "../../../42/fabric/type/promise/timeout.js"

const code = template(`
import ipc from "../../../42/core/ipc.js"
import env from "../../../42/core/env.js"
ipc.to.top.emit("{{.}}", env)
`)

const check = {
  iframe: 0,
  sandbox: 0,
  childWindow: 0,
  dedicatedWorker: 1,
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

test("realms", async (t, { collect, dest }) => {
  t.timeout(1000)

  const list = [
    check.iframe &&
      Promise.race([
        timeout(500, "iframe timed out"),
        new Promise((resolve) => ipc.on("42_ENV_IFRAME", resolve)),
      ]),
    check.sandbox &&
      Promise.race([
        timeout(500, "sandbox timed out"),
        new Promise((resolve) => ipc.on("42_ENV_SANDBOX", resolve)),
      ]),
    check.childWindow &&
      Promise.race([
        timeout(500, "childWindow timed out"),
        new Promise((resolve) => ipc.on("42_ENV_CHILDWINDOW", resolve)),
      ]),
    check.dedicatedWorker &&
      Promise.race([
        timeout(500, "dedicatedWorker timed out"),
        new Promise((resolve) => ipc.on("42_ENV_DEDICATEDWORKER", resolve)),
      ]),
  ]

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

    // ipc.from(worker).on("42_ENV_DEDICATEDWORKER", () => {
    //   // console.log("---- ipc.from(worker).on")
    // })

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
  }

  const [iframe, sandbox, childWindow, dedicatedWorker] = await Promise.all(
    list
  )

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

  if (check.iframe) {
    t.alike(iframe.runtime, view)
    t.alike(iframe.realm, realms.iframe)
  }

  if (check.sandbox) {
    t.alike(sandbox.runtime, view)
    t.alike(sandbox.realm, realms.sandbox)
  }

  if (check.childWindow) {
    t.alike(childWindow.runtime, view)
    t.alike(childWindow.realm, realms.childWindow)
  }

  if (check.dedicatedWorker) {
    t.alike(dedicatedWorker.runtime, worker)
    t.alike(dedicatedWorker.realm, realms.dedicatedWorker)
  }
})
