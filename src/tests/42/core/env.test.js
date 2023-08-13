/* eslint-disable no-implicit-coercion */
import test from "../../../42/test.js"
import env from "../../../42/core/env.js"

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

test("realm", (t) => {
  t.alike(env.realm, {
    inWindow: true,
    inChildWindow: false,
    inTop: true,
    inIframe: false,
    inOpaqueOrigin: false,
    inWorker: false,
    inSharedWorker: false,
    inServiceWorker: false,
    inDedicatedWorker: false,
  })
})

test("runtime", (t) => {
  t.alike(env.runtime, {
    inBackend: false,
    inNode: false,
    inDeno: false,
    inElectron: false,
    inFrontend: true,
    inBrowser: true,
    inAutomated: false,
    inPWA: false,
  })
})

test("browser", (t) => {
  t.alike(Object.keys(env.browser), [
    "name",
    "version",
    "semver",
    "isChrome",
    "isEdge",
    "isFirefox",
    "isIE",
    "isOpera",
    "isSafari",
  ])
})

test("engine", (t) => {
  t.alike(Object.keys(env.engine), ["name", "version"])
})

test("os", (t) => {
  t.alike(Object.keys(env.os), ["name", "version"])
})

test("device", (t) => {
  t.alike(Object.keys(env.device), ["vendor", "model", "type"])
})

test("cpu", (t) => {
  t.alike(Object.keys(env.cpu), ["architecture", "cores"])
})

test("gpu", (t) => {
  t.alike(Object.keys(env.gpu), ["supported", "active", "vendor", "model"])
})

test("network", (t) => {
  t.alike(Object.keys(env.network), ["online", "type", "effectiveType"])
})

test("languages", (t) => {
  t.isArray(env.languages)
  t.true(env.languages.every((x) => x && typeof x === "string"))
})
