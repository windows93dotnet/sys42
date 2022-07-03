// @thanks https://github.com/avajs/ava

import system from "./system.js"
import chainable from "./fabric/trait/chainable.js"
import Suite from "./system/dev/testing/class/Suite.js"
import Test from "./system/dev/testing/class/Test.js"
import ensureCurrentSuite from "./system/dev/testing/ensureCurrentSuite.js"
import addUtilities from "./system/dev/testing/addUtilities.js"

export { default as mock } from "./system/dev/testing/mock.js"

system.testing ??= {
  root: new Suite("#root"),
  testfiles: Object.create(null),
  suites: new Map(),
  iframes: [],
  ran: false,
  run: (...args) =>
    import("./system/dev/testing/runTests.js") //
      .then((m) => m.default(...args)),
  report: (...args) =>
    import("./system/dev/testing/reportTests.js") //
      .then((m) => m.default(...args)),
  serialize: (...args) =>
    import("./system/dev/testing/serializeTests.js") //
      .then((m) => m.default(...args)),
}

const sbs = system.testing
sbs.current = sbs.root

const suitesStack = []

const makeCallbackTest = (fn) => {
  const cb = (t) =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      t.end = (err) => (err ? reject(err) : resolve())
      try {
        await fn(t)
      } catch (err) {
        reject(err)
      }
    })
  cb.original = fn
  return cb
}

export const test = chainable(
  [
    "only",
    "skip",
    "noop",
    "todo",
    "failing",
    "serial",
    "cb",
    "flaky",
    "afterEach",
    "beforeEach",
    "setup",
    "teardown",
  ],
  {
    taskStackframe({ data }, value) {
      data.taskStackframe = value
    },
  },
  ({ data }, ...args) => {
    if (data.noop || data.todo) return

    let fn = args.pop()

    if (typeof fn !== "function") {
      throw new TypeError(
        `The last "test" argument must be a function. Received type ${typeof fn}`
      )
    }

    const stack = ensureCurrentSuite()

    Object.assign(data, sbs.current.testsOptions)

    if (data.afterEach) sbs.current.afterEach = [new Error(), fn]
    else if (data.beforeEach) sbs.current.beforeEach = [new Error(), fn]
    else if (data.setup) sbs.current.setups.push([new Error(), fn])
    else if (data.teardown) sbs.current.teardowns.push([new Error(), fn])
    else {
      const title = args

      if (data.cb) fn = makeCallbackTest(fn)

      const test = new Test(sbs.current, title, fn)
      if (data.taskStackframe) test.taskStackframe = data.taskStackframe
      const s = stack.find((x) => x.filename === sbs.current.filename)
      test.stackframe = s

      sbs.testfiles[s.filename] ??= Object.create(null)
      sbs.testfiles[s.filename][s.line] = test

      if (data.failing) test.failing = true
      if (data.skip) test.skip = true
      if (data.serial) test.serial = true
      if (data.flaky) test.flaky = 2

      if (data.only) {
        sbs.current.onlies.add(test)
        sbs.root.onlies.add(sbs.current)
      } else {
        sbs.current.tests.push(test)
      }
    }
  }
)

export const suite = chainable(
  [
    "only", //
    "skip",
    "serial",
  ],
  {
    timeout(_, value) {
      ensureCurrentSuite()
      sbs.current.timeout = value
    },
    tests(_, value) {
      ensureCurrentSuite()
      sbs.current.testsOptions = value
    },
  },
  ({ data }, title, fn) => {
    const previous = sbs.current
    if (typeof title === "function") {
      fn = title
      title = undefined
    }

    ensureCurrentSuite(title)

    if (
      suitesStack.includes(previous) === false &&
      sbs.current.filename === previous.filename
    ) {
      suitesStack.push(previous)
    }

    if (data.only) {
      for (const item of suitesStack) sbs.current.setups.push(...item.setups)
      sbs.root.onlies.add(sbs.current)
    }

    if (data.skip) sbs.current.skip = true
    if (data.serial) sbs.current.serial = true

    if (fn) {
      fn()
      sbs.current = suitesStack.pop() || sbs.root
    }

    return suite
  }
)

addUtilities(test)
addUtilities(suite)

test.suite = suite

export function awaitTestFileReady(url, retry = 100) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (retry-- < 0) {
        clearInterval(interval)
        reject(new Error(`Testfile didn't load: ${url}`))
      }

      if (url in sbs.testfiles) {
        clearInterval(interval)
        resolve()
      }
    }, 10)
  })
}

export async function htmlTest(url, retry) {
  const el = document.createElement("iframe")
  el.src = url
  await awaitTestFileReady(el.src, retry)
  sbs.iframes.push(el)
  return el
}

export default test
