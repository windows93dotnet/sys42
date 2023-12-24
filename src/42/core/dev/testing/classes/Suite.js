import serial from "../../../../fabric/type/promise/serial.js"
import parallel from "../../../../fabric/type/promise/parallel.js"
import groupBy from "../../../../fabric/type/array/groupBy.js"
import idle from "../../../../fabric/type/promise/idle.js"
import serializeError from "../../../../fabric/type/error/serializeError.js"
import ExecutionContext from "./ExecutionContext.js"
import mark from "../../../../fabric/type/any/mark.js"
import slugify from "../../../../fabric/type/string/slugify.js"

const dummyRootStats = {
  ok: undefined,
  total: 0,
  ran: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  onlies: 0,
}

function stringify(val) {
  return typeof val === "string" ? val : mark(val)
}

function addTitleGetter(obj) {
  const out = {}
  return Object.defineProperties(out, {
    title: {
      get() {
        return Array.isArray(obj.title)
          ? obj.title.map(stringify).join(" · ")
          : stringify(obj.title)
      },
    },
    slug: {
      get() {
        return slugify(out.title, { preserveUnicode: true, kebabCase: false })
      },
    },
  })
}

export default class Suite {
  constructor(title, filename, root) {
    this.title = title
    this.filename = filename

    this.root = root
    if (!this.root) {
      this.root = {
        stats: dummyRootStats,
      }
    }

    this.testsOptions = Object.create(null)

    this.reset()
    this.init()
  }

  reset() {
    this.stats = {
      ok: undefined,
      total: 0,
      ran: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      onlies: 0,
    }

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
    this.running = false
  }

  get ok() {
    return this.stats.ok
  }

  init() {
    this.running = false
    this.ms = 0
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
    if (options.nested !== true) {
      this.currentTest = test
      this.root.currentTest = test
    }

    if (test.skip) {
      this.stats.skipped++
      this.root.stats.skipped++
      return
    }

    test.running = true

    await idle({ timeout: 3000 })

    if (this.beforeEach) await this.warnOnThrow(this.beforeEach, "beforeEach")

    const t = new ExecutionContext()

    t.suite = addTitleGetter(this)
    t.test = addTitleGetter(test)

    test.timeStamp = performance.now()

    try {
      await Promise.race([
        t.timeout(this.timeout, this.cumulated + 100),
        test.fn(t, t.utils),
        test.deferred,
      ])

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

    test.done.resolve(t)

    if (test.ok === false && test.flaky) {
      t.cleanup()
      test.flaky--
      delete test.error
      await this.runTest(test, options)
      return
    }

    if (t.glovebox?.ready) await t.glovebox.ready

    const nesteds =
      test.nestedsOnlies.length > 0
        ? test.nestedsOnlies
        : test.nesteds.length > 0
          ? test.nesteds
          : undefined

    if (nesteds) await this.runNesteds(test, nesteds, options)

    t.cleanup()

    test.ms = performance.now() - test.timeStamp
    this.cumulated += test.ms

    test.ran = true

    this.stats.ran++
    this.root.stats.ran++

    if (test.ok) {
      if (test.failing) this.failing = true
      this.stats.passed++
      this.root.stats.passed++
      this.stats.ok ??= true
      this.root.stats.ok ??= true
    } else {
      this.stats.ok = false
      this.root.stats.ok = false
      this.stats.failed++
      this.root.stats.failed++
    }

    if (t.logs.length > 0) test.logs.push(...t.logs)

    if (options.oneach) options.oneach(test)

    if (this.afterEach) await this.warnOnThrow(this.afterEach, "afterEach")

    test.running = false
  }

  async runNesteds(test, nesteds, options) {
    const suites = new Set()
    const undones = []
    const index = this.tests.indexOf(test)
    const config = { ...options, nested: true }

    // TODO: group parallel and serial tests

    for (const nestedTest of nesteds) {
      if (nestedTest.ran) continue
      if (nestedTest.running) {
        undones.push(nestedTest.done)
        continue
      }

      this.tests.splice(index + 1, 0, nestedTest)
      const { suite } = nestedTest
      undones.push(
        suite.runTest(nestedTest, config).then(() => {
          if (suite !== this) suites.add(suite)
        }),
      )
    }

    await Promise.all(undones)
  }

  async runSuite(suite, options) {
    return suite.runTests(options)
  }

  async runTests(options) {
    this.running = true

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
        : "parallel",
    )

    const suites = groupBy(this.suites, (suite) =>
      options?.serial || suite.serial ? "serial" : "parallel",
    )

    const p = []
    const s = []

    if (tests?.parallel?.length) {
      p.push(parallel(tests.parallel, (test) => this.runTest(test, options)))
    }

    if (suites?.parallel?.length) {
      p.push(
        parallel(suites.parallel, (suite) => this.runSuite(suite, options)),
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
    this.root.stats.onlies += this.stats.onlies

    if (this.title === "#root") {
      this.ms = performance.now() - timeStamp
    }

    this.stats.ok = Boolean(this.stats.ok)

    return this
  }

  toJSON() {
    return {
      title: this.title,
      filename: this.filename,
      ms: this.ms,
      ok: this.stats.ok,
      skip: this.skip,
      stats: this.stats,
      suites: this.suites.map((suite) => suite.toJSON()),
      tests: this.tests.map((test) => test.toJSON()),
      uncaughts: this.uncaughts.map((err) => serializeError(err)),
      warnings: this.warnings.map(([context, originErr, err]) => [
        context,
        serializeError(originErr).stack.find(({ filename }) =>
          filename.endsWith(".test.js"),
        ),
        serializeError(err),
      ]),
    }
  }
}
