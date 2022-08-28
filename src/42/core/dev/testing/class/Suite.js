import serial from "../../../../fabric/type/promise/serial.js"
import sleep from "../../../../fabric/type/promise/sleep.js"
import parallel from "../../../../fabric/type/promise/parallel.js"
import groupBy from "../../../../fabric/type/array/groupBy.js"
import noop from "../../../../fabric/type/function/noop.js"
import ExecutionContext from "../ExecutionContext.js"
import serializeError from "../../../../fabric/type/error/serializeError.js"

export default class Suite {
  constructor(title, filename) {
    this.title = title
    this.filename = filename
    this.stats = Object.create(null)
    this.testsOptions = Object.create(null)
    this.suites = []
    this.tests = []
    this.onlies = new Set()
    this.setups = []
    this.teardowns = []
    this.warnings = []
    this.uncaughts = []
    this.timeout = 300
    this.only = false
    this.skip = false
    this.serial = false
    this.cumulated = 0
    this.init()
  }

  init() {
    this.ok = undefined
    this.ms = 0
    this.stats.total = 0
    this.stats.ran = 0
    this.stats.passed = 0
    this.stats.failed = 0
    this.stats.skipped = 0
    this.stats.onlies = 0
    this.uncaughts.length = 0
    for (const test of this.tests) test.init()
    for (const suite of this.suites) suite.init()
    return this
  }

  async warnOnThrow([originErr, fn], context) {
    try {
      await fn()
    } catch (err) {
      this.warnings.push([`error in "${context}"`, originErr, err])
    }
  }

  async runTest(test, options = {}) {
    const { oneach = noop } = options

    if (test.skip) {
      this.stats.skipped++
      return
    }

    await sleep(0)

    if (this.beforeEach) await this.warnOnThrow(this.beforeEach, "beforeEach")

    const t = new ExecutionContext()

    t.utils.suiteTitle = this.title

    try {
      test.timeStamp = performance.now()
      await Promise.race([
        t.timeout(this.timeout, this.cumulated + 100),
        test.fn(t, t.utils),
        test.deferred.promise,
      ])
      test.ms = performance.now() - test.timeStamp
      this.cumulated += test.ms
      t.verifyContext(test.failing, test.stackframe)
      test.ok = true
    } catch (err) {
      test.error = err
      if (
        test.failing === true &&
        !err.message.startsWith("Test was expected to fail")
      ) {
        test.ok = true
      }
    }

    t.cleanup()

    if (test.ok === false && test.flaky) {
      test.flaky--
      delete test.error
      await this.runTest(test, options)
      return
    }

    test.ran = true

    this.stats.ran++

    if (test.ok) {
      if (test.failing) this.failing = true
      this.stats.passed++
      if (this.ok === undefined) this.ok = true
    } else {
      this.ok = false
      this.stats.failed++
    }

    if (t.logs.length > 0) test.logs.push(...t.logs)

    oneach(test)

    if (this.afterEach) await this.warnOnThrow(this.afterEach, "afterEach")
  }

  async runSuite(suite, options) {
    const results = await suite.runTests(options)

    this.cumulated += results.cumulated
    this.stats.total += results.stats.total
    this.stats.ran += results.stats.ran
    this.stats.passed += results.stats.passed
    this.stats.failed += results.stats.failed
    this.stats.skipped += results.stats.skipped

    if (!results.skip) {
      if (results.ok) {
        if (this.ok === undefined) this.ok = true
      } else this.ok = false
    }

    return results
  }

  async runTests(options) {
    let timeStamp
    if (this.title === "#root") timeStamp = performance.now()

    if (this.skip) {
      this.stats.total = this.tests.length
      this.stats.skipped = this.tests.length
      return this
    }

    if (this.setups.length > 0) {
      await serial(this.setups, (x) => this.warnOnThrow(x, "setup"))
    }

    this.stats.total = this.tests.length
    if (this.onlies.size > 0) {
      if (this.title === "#root") {
        this.suites = [...this.onlies]
      } else {
        this.stats.skipped = this.tests.length
        this.stats.total += this.onlies.size
        this.tests = [...this.onlies]
      }
    }

    const tests = groupBy(this.tests, (test) =>
      options?.serial || test.serial || this.afterEach || this.beforeEach
        ? "serial"
        : "parallel"
    )

    const suites = groupBy(this.suites, (suite) =>
      options?.serial || suite.serial ? "serial" : "parallel"
    )

    const p = []
    const s = []

    if (tests?.parallel?.length) {
      p.push(parallel(tests.parallel, (test) => this.runTest(test, options)))
    }

    if (suites?.parallel?.length) {
      p.push(
        parallel(suites.parallel, (suite) => this.runSuite(suite, options))
      )
    }

    await parallel(p)

    if (tests?.serial?.length) {
      s.push(serial(tests.serial, (test) => this.runTest(test, options)))
    }

    if (suites?.serial?.length) {
      s.push(serial(suites.serial, (suite) => this.runSuite(suite, options)))
    }

    await serial(s)

    if (this.teardowns.length > 0) {
      await serial(this.teardowns, (x) => this.warnOnThrow(x, "teardown"))
    }

    this.stats.onlies = this.onlies.size

    if (this.title === "#root") this.ms = performance.now() - timeStamp

    this.ok = Boolean(this.ok)

    return this
  }

  toJSON() {
    return {
      title: this.title,
      filename: this.filename,
      ms: this.ms,
      ok: this.ok,
      skip: this.skip,
      stats: this.stats,
      suites: this.suites.map((suite) => suite.toJSON()),
      tests: this.tests.map((test) => test.toJSON()),
      uncaughts: this.uncaughts.map((err) => serializeError(err)),
      warnings: this.warnings.map(([context, originErr, err]) => [
        context,
        serializeError(originErr).stack.find(({ filename }) =>
          filename.endsWith(".test.js")
        ),
        serializeError(err),
      ]),
    }
  }
}
