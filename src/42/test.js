// @thanks https://github.com/avajs/ava

import system from "./core/dev/testing/mainSystem.js"
import chainable from "./fabric/traits/chainable.js"
import Suite from "./core/dev/testing/classes/Suite.js"
import Test from "./core/dev/testing/classes/Test.js"
import ensureCurrentSuite from "./core/dev/testing/ensureCurrentSuite.js"
import addUtilities from "./core/dev/testing/addUtilities.js"
import uiTest from "./core/dev/testing/helpers/uiTest.js"
import inIframe from "./core/env/realm/inIframe.js"
import equals from "./fabric/type/any/equals.js"

export { default as mock } from "./core/dev/testing/mock.js"

system.DEV = true

const params = new URLSearchParams(location.search)
const inGlovebox = inIframe && params.has("test")
const initiator = params.get("initiator")
const parallel = params.get("parallel")

system.testing ??= {
  root: new Suite("#root"),
  suites: new Map(),
  iframes: new Set(),
  testfiles: {},
  inTestRunner: false,
  manual: false,
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

function makeTest(title, data, stack, fn) {
  if (data.ui) {
    fn = uiTest(fn, sbs)
    data.serial = true
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
    if (inGlovebox && !equals(test.title, sbs.root.currentTest.title)) return

    if (data.only) sbs.root.currentTest.nestedsOnlies.push(test)
    else sbs.root.currentTest.nesteds.push(test)

    if (inGlovebox && initiator) {
      globalThis.parent.postMessage(initiator)
      if (parallel) {
        sbs.root.currentTest.suite.runNesteds(sbs.root.currentTest, [test])
      }
    }
  } else if (data.only) {
    sbs.current.onlies.add(test)
    sbs.root.onlies.add(sbs.current)
  } else {
    sbs.current.tests.push(test)
  }
}

export const test = chainable(
  [
    "only",
    "skip",
    "noop",
    "todo",
    "failing",
    "serial",
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

    const fn = args.pop()

    if (typeof fn !== "function") {
      throw new TypeError(
        `The last "test" argument must be a function. Received type ${typeof fn}`,
      )
    }

    const stack = ensureCurrentSuite()

    Object.assign(data, sbs.current.testsOptions)

    if (data.afterEach) sbs.current.afterEach = [new Error(), fn]
    else if (data.beforeEach) sbs.current.beforeEach = [new Error(), fn]
    else if (data.setup) sbs.current.setups.push([new Error(), fn])
    else if (data.teardown) sbs.current.teardowns.push([new Error(), fn])
    else return makeTest(args, data, stack, fn)
  },
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
  },
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
