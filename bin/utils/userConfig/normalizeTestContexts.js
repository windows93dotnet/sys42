import configure from "../../../src/42/core/configure.js"
import normalizeConfig from "./normalizeConfig.js"

export const TEST_CTX_ALIASES = {
  chromium: ["🔵", "gc", "chrome", "google-chrome"],
  firefox: ["🦊", "ff"],
  // TODO: support webkit & electron
  // webkit: ["🧭", "safari", "sf", "wk"],
  // electron: ["⚛️", "el"],
  node: ["🟢", "⬢", "⬡", "nodejs", "node-js", "nd"],
  deno: ["🦕", "denojs", "deno-js", "dn"],
  // opera: ["🅾️"],
  // edge: ["🇪", "📧"],
  // brave: ["🦁", "🛡️"],
}

export const TEST_CTX_KEYS = Object.keys(TEST_CTX_ALIASES)

export const TEST_CTX_TYPES = {
  chromium: "frontend",
  firefox: "frontend",
  webkit: "frontend",
  electron: "frontend",
  node: "backend",
  deno: "backend",
}

export const TEST_CTX = ["--all", "-A"]

const TEST_CTX_NORMALIZE = {}
Object.entries(TEST_CTX_ALIASES).forEach(([key, val]) => {
  TEST_CTX.push(`--${key}`)
  TEST_CTX_NORMALIZE[key] = key
  TEST_CTX_NORMALIZE[`--${key}`] = key
  val.forEach((x) => {
    TEST_CTX_NORMALIZE[x] = key
    TEST_CTX_NORMALIZE[`--${x}`] = key
    TEST_CTX.push(`--${x}`)
  })
})

export default function normalizeTestContexts(test) {
  if (test.ctx) {
    if ("-A" in test.ctx || "--all" in test.ctx) {
      test.ctx = {}
      for (const key of TEST_CTX_KEYS) {
        test.ctx[key] = test.ctx["--all"] ?? test.ctx["-A"] ?? {}
      }
    }

    const ctx = Object.entries(test.ctx)

    if (ctx.length > 0) test.run = []

    for (let [key, val] of ctx) {
      if (key in TEST_CTX_NORMALIZE === false) {
        throw new Error(`${key} is not a valid test context`)
      }

      key = TEST_CTX_NORMALIZE[key]
      test.run.push(key)

      if (typeof val !== "object") val = {}
      test.ctx[key] = val
    }
  }

  for (const key of TEST_CTX_KEYS) {
    let contextType = test[TEST_CTX_TYPES[key]]
    if (typeof contextType !== "object") contextType = {}
    const ctxVal = test.ctx && key in test.ctx ? test.ctx[key] : {}
    test[key].icon = TEST_CTX_ALIASES[key][0]
    const def = normalizeConfig(contextType, test)
    test[key] = normalizeConfig(configure(contextType, test[key], ctxVal), def)
    for (const pattern of def.glob) {
      if (!test[key].glob.includes(pattern)) test[key].glob.push(pattern)
    }
  }

  delete test.ctx
}
