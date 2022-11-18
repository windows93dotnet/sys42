/* eslint-disable eqeqeq */
/* eslint-disable unicorn/no-object-as-default-parameter */

// @thanks https://github.com/avajs/ava
// @thanks https://github.com/substack/tape

import equal from "../../../../fabric/type/any/equal.js"
import clone from "../../../../fabric/type/any/clone.js"
import pluralize from "../../../../fabric/type/string/pluralize.js"
import * as is from "../../../../fabric/type/any/is.js"
import Stub from "./Stub.js"
import Spy from "./Spy.js"
import addStack from "../../../../fabric/type/error/addStack.js"
import template from "../../../formats/template.js"

const { isPromiseLike } = is

const setTimeoutNative = globalThis.setTimeout
const clearTimeoutNative = globalThis.clearTimeout

const PLACEHOLDER = Symbol.for("Assert.PLACEHOLDER")

export class AssertionError extends Error {
  constructor(userMessage, message, details, stack) {
    if (typeof userMessage === "string") {
      userMessage = template.render(userMessage, { message, ...details })
    } else {
      details = { ...details, ...userMessage }
      userMessage = undefined
    }

    super(userMessage ?? message ?? "Unspecified AssertionError")
    Object.defineProperty(this, "name", { value: "AssertionError" })
    if (details) Object.assign(this, clone(details))
    if (stack) addStack(this, stack)
  }
}

export class VerifyError extends Error {
  constructor(message, stack, details) {
    super(message)
    Object.defineProperty(this, "name", { value: "VerifyError" })
    if (details) Object.assign(this, clone(details))
    if (stack) addStack(this, stack)
  }
}

export const checkError = (err, expected) => {
  if (!expected) return true

  if (typeof expected === "string") return err.message === expected

  if (
    expected instanceof Error ||
    (expected.prototype && expected.prototype instanceof Error)
  ) {
    return err instanceof expected
  }

  if (expected instanceof RegExp) {
    const string =
      err.stack && err.stack.includes(err.message)
        ? err.stack
        : `${err.message}\n${err.stack}`
    return Boolean(string.match(expected))
  }

  for (const [key, val] of Object.entries(expected)) {
    if (key === "instanceOf") {
      if (!(err instanceof val)) return false
      continue
    }

    if (key in err === false) return false

    if (val instanceof RegExp) {
      if (!err[key].match(val)) return false
    } else if (!equal(err[key], val)) return false
  }

  return true
}

export const assertError = (err, expected, message, stack) => {
  if (!checkError(err, expected)) {
    let out = "Threw unexpected exception"
    if (message) out += `\n${message}`
    throw new AssertionError(out, undefined, { actual: err, expected }, stack)
  }

  return err
}

export default class Assert {
  #cumulated
  #timeoutDelay
  #timeoutId
  #resolveTimeout

  #count = 0
  #pending = 0
  #planned = false

  #laps = []
  #stayings = []
  #teardowns = []

  spies = []
  stubs = []

  constructor() {
    // "tape" compatibility
    this.ok = this.truthy
    this.notOk = this.falsy
    this.equal = this.is
    this.deepEqual = this.eq
    this.notDeepEqual = this.notEq

    Object.entries(is).forEach(([key, check]) => {
      const not = `isNot${key.slice(2)}`
      const type =
        key === "isNaN" ? "NaN" : key.charAt(2).toLowerCase() + key.slice(3)
      this[key] = (actual, message, details = { actual }) => {
        this.#addCall()
        if (check(actual) === false) {
          const why = `value is not "${type}"`
          message = message ? `${message}\n${why}` : why
          throw new AssertionError(message, undefined, details)
        }
      }

      this[not] = (actual, message, details = { actual }) => {
        this.#addCall()
        if (check(actual) === true) {
          const why = `value should not be "${type}"`
          message = message ? `${message}\n${why}` : why
          throw new AssertionError(message, undefined, details)
        }
      }
    })
  }

  #addCall() {
    this.#count++
    // reset timeout after any activity in the test
    // https://github.com/avajs/ava/issues/1565#issuecomment-342761446
    this.timeout("reset")
  }

  teardown(fn) {
    this.#teardowns.push(fn)
  }

  cleanup() {
    this.#count = 0
    this.#pending = 0
    this.#planned = false
    for (const spy of this.spies) spy.restore()
    for (const fn of this.#teardowns) fn()
    this.spies.length = 0
    this.stubs.length = 0
    this.#laps.length = 0
    this.#stayings.length = 0
  }

  verifyContext(failing, stackframe) {
    if (this.#timeoutId === true) {
      let details
      if (this.#laps.length > 0) details = { laps: this.#laps }
      throw new VerifyError("Test timed out", stackframe, details)
    } else clearTimeoutNative(this.#timeoutId)

    for (const { actual, expected, error } of this.#stayings) {
      if (equal(actual, expected) === false) {
        const clonedActual = clone(actual)
        error.actual = clonedActual
        error.expected = expected
        throw error
      }
    }

    if (this.#pending > 0) {
      throw new VerifyError(
        "An async assertion didn't resolved before test end, you should use `await` before it",
        stackframe
      )
    }

    if (this.#planned === false) {
      if (this.#count === 0) {
        throw new VerifyError(
          "Test finished without running any assertions",
          stackframe
        )
      }
    } else if (this.#planned !== this.#count) {
      throw new VerifyError(
        `Planned for ${this.#planned} ${pluralize(
          "assertion",
          this.#planned
        )}, but got ${this.#count}`,
        stackframe
      )
    }

    if (failing === true) {
      throw new VerifyError(
        "Test was expected to fail, but succeeded, you should stop marking the test as failing",
        stackframe
      )
    }
  }

  // check that "actual" don't mutate
  stays(actual, message) {
    this.#addCall()
    const expected = clone(actual)
    const error = new AssertionError(message, "Value has mutated")
    this.#stayings.push({ actual, expected, error })
    return actual
  }

  stub(fn) {
    const stub = new Stub(fn)
    this.stubs.push(stub)
    return stub
  }

  spy(object, method, fn, thisArg) {
    const spy = new Spy(object, method, fn, thisArg)
    this.spies.push(spy)
    return spy
  }

  sleep(ms) {
    this.timeout(this.#timeoutDelay + ms)
    return new Promise((resolve) => setTimeoutNative(resolve, ms))
  }

  lap(val) {
    this.timeout("reset")
    this.#laps.push(new Error())
    return val
  }

  timeout(ms = 300, cumulated = 0) {
    this.#cumulated ??= cumulated
    this.#timeoutDelay = ms === "reset" ? this.#timeoutDelay : ms
    clearTimeoutNative(this.#timeoutId)
    this.#timeoutId = setTimeoutNative(() => {
      this.#timeoutId = true
      this.#resolveTimeout()
      this.#resolveTimeout = undefined
    }, this.#timeoutDelay + this.#cumulated)

    if (this.#resolveTimeout === undefined) {
      return new Promise((resolve) => {
        this.#resolveTimeout = resolve
      })
    }
  }

  plan(planned) {
    this.#planned = planned
  }

  pass() {
    this.#addCall()
  }

  fail(message, details) {
    throw new AssertionError(message, "Test failed via fail()", details)
  }

  true(actual, message, details = { actual }) {
    this.#addCall()
    if (actual !== true) {
      throw new AssertionError(message, "Value is not true", details)
    }
  }

  false(actual, message, details = { actual }) {
    this.#addCall()
    if (actual !== false) {
      throw new AssertionError(message, "Value is not false", details)
    }
  }

  truthy(actual, message, details = { actual }) {
    this.#addCall()
    if (actual != true) {
      throw new AssertionError(message, "Value is not truthy", details)
    }
  }

  falsy(actual, message, details = { actual }) {
    this.#addCall()
    if (actual != false) {
      throw new AssertionError(message, "Value is not falsy", details)
    }
  }

  is(actual, expected, message, nested) {
    if (nested !== true) this.#addCall()
    if (!Object.is(actual, expected)) {
      if (equal(actual, expected)) {
        throw new AssertionError(
          message,
          "Values are deeply equal but are not the same"
        )
      } else {
        throw new AssertionError(message, "Values are not the same", {
          actual,
          expected,
        })
      }
    }
  }

  not(actual, expected, message) {
    this.#addCall()
    if (Object.is(actual, expected)) {
      throw new AssertionError(message, "Values are the same", {
        actual,
        expected,
      })
    }
  }

  eq(actual, expected, message) {
    this.#addCall()
    if (equal(actual, expected, { placeholder: PLACEHOLDER }) === false) {
      const clonedActual = clone(actual)
      throw new AssertionError(message, "Values are not deeply equal", {
        actual: clonedActual,
        expected,
      })
    }
  }

  notEq(actual, expected, message) {
    this.#addCall()
    if (equal(actual, expected)) {
      throw new AssertionError(message, "Values are deeply equal", {
        actual,
        expected,
      })
    }
  }

  any(actual, expected, message) {
    this.#addCall()
    for (const item of expected) {
      if (equal(actual, item, { placeholder: PLACEHOLDER })) return
    }

    const clonedActual = clone(actual)
    throw new AssertionError(message, "None of the expected values are equal", {
      actual: clonedActual,
      expected,
    })
  }

  // "equal" without check for prototypes
  // simplify deep equal test for objects created using Object.create(null)
  alike(actual, expected, message) {
    this.#addCall()
    if (equal(actual, expected, { proto: false }) === false) {
      const clonedActual = clone(actual)
      throw new AssertionError(message, "Values are not deeply alike", {
        actual: clonedActual,
        expected,
      })
    }
  }

  notAlike(actual, expected, message) {
    this.#addCall()
    if (equal(actual, expected, { proto: false })) {
      throw new AssertionError(message, "Values are deeply alike", {
        actual,
        expected,
      })
    }
  }

  match(string, regex, message, details) {
    this.#addCall()
    string = String(string)
    if (!string.match(regex)) {
      throw new AssertionError(message, "Value must match regex", {
        string,
        regex,
        ...details,
      })
    }
  }

  notMatch(string, regex, message) {
    this.#addCall()
    string = String(string)
    if (string.match(regex)) {
      throw new AssertionError(message, "Value must not match regex", {
        string,
        regex,
      })
    }
  }

  instanceOf(actual, expected, message) {
    this.#addCall()

    if (!expected?.name) {
      this.fail(`instanceOf() expected must be called with a constructor`)
    }

    if (!(actual instanceof expected)) {
      throw new AssertionError(
        message,
        `Value is not an instance of ${expected.name}`,
        { actual, expected }
      )
    }
  }

  hasSubset(actual, expected, message, nested = "") {
    if (nested.length === 0) this.#addCall()

    try {
      if (is.isObjectOrArray(actual) === false) {
        this.fail(`hasSubset() must be called with an object`)
      }

      Object.entries(expected).forEach(([key, val]) => {
        const path = `${nested}/${key}`

        if (val !== undefined && key in actual === false) {
          this.fail(`"${path}" is not defined`)
        }

        if (is.isHashmapLike(val) || is.isArray(val)) {
          this.hasSubset(
            actual[key], //
            val,
            false,
            path
          )
        } else if (val === PLACEHOLDER) {
          if (key in actual !== true) {
            throw new AssertionError(
              message,
              `"${path}" is not the same as the expected one`
            )
          }
        } else {
          this.is(
            actual[key],
            val,
            `"${path}" is not the same as the expected one`,
            path
          )
        }
      })
    } catch (err) {
      if (message === false) throw err
      const details = {}
      details.actual = "actual" in err ? err.actual : actual
      details.expected = "expected" in err ? err.expected : expected
      throw new AssertionError(
        message ?? err.nested ?? err.message,
        undefined,
        details
      )
    }
  }

  contains(actual, expected, message) {
    this.#addCall()
    if (Array.isArray(actual) === false) {
      throw new AssertionError("contains() must be called with an array", {
        actual,
        expected,
      })
    }

    if (actual.some((item) => equal(item, expected)) === false) {
      throw new AssertionError(message, `Value does not contain expectation`, {
        actual,
        expected,
      })
    }
  }

  throws(fn, expected, message) {
    if (arguments.length === 2 && expected === undefined) {
      throw new TypeError(
        `If "expected" argument is defined it can't be of type undefined`
      )
    }

    const { stack } = new Error()
    this.#addCall()

    if (isPromiseLike(fn)) {
      return this.#deferThrows(fn, expected, message, stack)
    }

    try {
      const res = fn()
      if (isPromiseLike(res)) {
        return this.#deferThrows(res, expected, message, stack)
      }
    } catch (err) {
      return assertError(err, expected, message, stack)
    }

    throw new AssertionError(message, "Function must throw", { expected })
  }

  #deferThrows(fn, expected, message, stack) {
    this.#pending++
    return new Promise((resolve, reject) => {
      fn.then(
        () =>
          reject(
            new AssertionError(
              message,
              "Function must throw",
              { expected },
              stack
            )
          ),
        (error) => {
          try {
            resolve(assertError(error, expected, message, stack))
          } catch (err) {
            reject(err)
          }
        }
      ).finally(() => this.#pending--)
    })
  }

  notThrows(fn, message) {
    const { stack } = new Error()
    this.#addCall()

    if (isPromiseLike(fn)) return this.#deferNotThrows(fn, message, stack)

    try {
      const res = fn()
      if (isPromiseLike(res)) {
        return this.#deferNotThrows(res, message, stack)
      }
    } catch (error) {
      throw new AssertionError(message, `Function must not throw`, { error })
    }
  }

  #deferNotThrows(fn, message, stack) {
    this.#pending++
    return new Promise((resolve, reject) => {
      fn.then(
        () => resolve(),
        (error) => {
          reject(
            new AssertionError(
              message,
              `Function must not throw`,
              { error },
              stack
            )
          )
        }
      ).finally(() => this.#pending--)
    })
  }
}
