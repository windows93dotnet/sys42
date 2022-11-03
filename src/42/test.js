// @thanks https://github.com/avajs/ava

import system from "./core/dev/testing/mainSystem.js"
import chainable from "./fabric/traits/chainable.js"
import Suite from "./core/dev/testing/classes/Suite.js"
import Test from "./core/dev/testing/classes/Test.js"
import ensureCurrentSuite from "./core/dev/testing/ensureCurrentSuite.js"
import addUtilities from "./core/dev/testing/addUtilities.js"
import uiTest from "./core/dev/testing/uiTest.js"
import inIframe from "./core/env/realm/inIframe.js"

export { default as mock } from "./core/dev/testing/mock.js"

system.DEV = true

system.testing ??= {
  root: new Suite("#root"),
  testfiles: Object.create(null),
  suites: new Map(),
  iframes: [],
  started: false,
  ran: false,
  run: (...args) =>
    import("./core/dev/testing/runTests.js") //
      .then((m) => m.default(...args)),
  report: (...args) =>
    import("./core/dev/testing/reportTests.js") //
      .then((m) => m.default(...args)),
  serialize: (...args) =>
    import("./core/dev/testing/serializeTests.js") //
      .then((m) => m.default(...args)),
}

const sbs = system.testing
sbs.current = sbs.root

export { sbs }

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
    "ui",
  ],
  {
    taskError({ data }, value) {
      data.taskError = value
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
      if (data.ui) {
        fn = uiTest(fn, sbs)
        data.serial = true
        // data.flaky = 2 // TODO: remove flaky for self-executed ui tests
        sbs.current.serial = true
        sbs.current.timeout = 4500
      }

      const test = new Test(sbs.current, title, fn)
      if (data.taskError) test.taskError = data.taskError
      const s = stack.find((x) => x.filename === sbs.current.filename)
      test.stackframe = s

      sbs.testfiles[s.filename] ??= Object.create(null)
      sbs.testfiles[s.filename][s.line] = test

      if (data.failing) test.failing = true
      if (data.skip) test.skip = true
      if (data.serial) test.serial = true
      if (data.flaky) test.flaky = 2

      // nested tests
      if (sbs.root.running) {
        if (data.only) {
          throw new Error('nested tests "only" option is not supported')
        }

        sbs.current.tests.push(test)
        const promise = inIframe
          ? sbs.root.currentTest.done.then(() =>
              test.suite.runTest(test, { nested: true })
            )
          : test.suite.runTest(test, { nested: true })

        sbs.root.currentTest.nesteds.push(promise)

        return promise
      }

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

Object.defineProperty(suite, "title", {
  get() {
    ensureCurrentSuite()
    return sbs.current.title
  },
})

test.suite = suite

addUtilities(test)
addUtilities(suite)

export default test
