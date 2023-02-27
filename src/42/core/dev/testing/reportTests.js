/* eslint-disable complexity */
import configure from "../../configure.js"
import inBackend from "../../env/runtime/inBackend.js"
import log from "../../log.js"
import highlight from "../../console/formats/highlight.js"
import formatFilename from "../../console/formats/formatFilename.js"
import formatError from "../../console/formats/formatError.js"
import truncate from "../../../fabric/type/string/truncate.js"
import equal from "../../../fabric/type/any/equal.js"
import pluralize from "../../../fabric/type/string/pluralize.js"
import { escapeLog } from "../../console/logUtils.js"

const DEFAULTS = {
  verbose: 1,
  consoleClear: false,
}

const failed = []
const logs = []
const warnings = []

const logged = new WeakSet()

const getSuiteTitle = ({ title, skip }, highlightLast) =>
  title
    .split("/")
    .filter((x) => x !== ".")
    .map(
      (x, i, arr) =>
        `{${skip ? "magenta.dim" : ""}${
          skip ? "" : highlightLast && i === arr.length - 1 ? "reset" : "dim"
        } ${escapeLog(x)}}`
    )
    .join(` {${skip ? "magenta.dim" : "grey"} ›} `)

const getTestTitle = ({ title, ok, skip }) =>
  title
    .map(
      (x) => `{${skip ? "magenta.dim" : ok ? "reset" : "red"} ${escapeLog(x)}}`
    )
    .join(` {${skip ? "magenta.dim" : "dim"} ·} `)
    .replace(/\n/g, "␤")

const getStats = (suite, config, isRootSuite) => {
  let begin = ""

  const { stats, ms } = suite

  const percent =
    stats.passed > 0 && stats.ran > 0
      ? Math.floor((stats.passed / stats.ran) * 100)
      : 0

  const color = suite.ok ? "green" : "red"

  begin += isRootSuite
    ? `{${color} ${percent}%} {grey.dim •} ` // –
    : ` {grey.dim •} `

  let end = ``
  if (isRootSuite || (config.serial && ms > 1)) {
    end = ` {grey.dim •} {grey ${Math.round(ms)}}{grey ms}`
  }

  let numbers = ""

  if (stats.failed) {
    numbers += `{red ✖ ${stats.failed}}`
    if (stats.passed) numbers += " {grey +} "
  }

  if (stats.passed) {
    numbers += `{green ✔ ${stats.passed}}`
  }

  if (stats.ran === 0) {
    numbers += `{red 0}`
  }

  numbers += ` {grey /} {grey ${stats.ran}}`
  if (stats.skipped) {
    numbers += ` {magenta.dim ~ ${stats.skipped}}`
  }

  return begin + numbers + end
}

const getFooter = (results, config) => {
  let footer = ""

  footer += `\n${getStats(results, config, true)}`

  const { onlies } = results.stats

  footer +=
    onlies > 0
      ? ` {red ┈ ${onlies} ${pluralize("only suite", onlies)} ┈}\n`
      : "\n"

  return footer
}

const displayTest = (test, config, options) => {
  const showError = options?.showError
  test.icon ??= config.icon ?? ""

  const testTitle = getTestTitle(test)

  let title = `${getSuiteTitle({
    title: test.suiteTitle,
    skip: test.skip,
  })} {${test.skip ? "magenta.dim" : "grey"} ${testTitle ? "›" : "·"}} `

  title += testTitle

  if (globalThis?.process?.stdout?.columns) {
    title = truncate(title, globalThis.process.stdout.columns + 110)
  }

  if (config.serial && test.ms > 1) {
    title += ` {grey.dim •} {grey ${Math.round(test.ms)}ms}`
  }

  if (config.verbose > 3) {
    title += showError && test.error ? "\n" : " "
    title += `${formatFilename(
      test.stackframe,
      test.skip ? "magenta" : test.error ? "red" : "green"
    )}`
  }

  let err = ""
  if (test.error && !(test.ok && test.failing)) {
    err += "\n\n"
    err += formatError(test.error, {
      entries: {
        newline: "\n\n",
        valueFormater(x) {
          if (typeof x === "string") return highlight(x)
          if (Array.isArray(x)) {
            let laps = ""
            for (const item of x) {
              laps += "\n  {grey.dim •} " + formatFilename(item, "red")
            }

            return laps
          }

          return (
            "\n{dim.grey ┌╴}\n{dim.grey │} " +
            formatError(x, { compact: true })
              .replaceAll("\n", "\n{dim.grey │} ")
              .replace(/│} $/, "└╴} ")
          )
        },
      },
    })

    if (!showError) {
      failed.push(test)
    }
  }

  if (test.logs && !logged.has(test.logs)) {
    logs.push(...test.logs.map((arr) => [test.icon, ...arr]))
    logged.add(test.logs)
  }

  let prefix =
    test.icon +
    (test.skip ? "{magenta.dim ~} " : test.ok ? "{green ✔} " : "{red ✖} ")

  if (showError || config.verbose > 2) {
    if (showError) prefix = `\n${prefix}`

    if (test.error && !(test.ok && test.failing) && !inBackend) {
      if (showError) {
        log.br()
        log.groupCollapsed((prefix + title + err).trimStart())
        console.log(test.error.original)
        log.groupEnd()
      } else {
        log.groupCollapsed(prefix + title)
        log.groupCollapsed(err.slice(1))
        console.log(test.error.original)
        log.groupEnd()
        log.groupEnd()
      }
    } else {
      log(prefix + title + err)
    }
  } else if (!test.suiteOk && !inBackend) {
    if (test.error && !(test.ok && test.failing)) {
      log.groupCollapsed(prefix + getTestTitle(test))
      log.groupCollapsed(err.slice(1))
      console.log(test.error.original)
      log.groupEnd()
      log.groupEnd()
    } else {
      log(prefix + getTestTitle(test))
    }
  }
}

const displaySuiteHeader = (suite, config) => {
  const title = `${getSuiteTitle(suite, true)}`
  const stats = getStats(suite, config)
  log
    .prefix(
      config.icon +
        (suite.skip ? "{magenta.dim ~} " : suite.ok ? "{green ✔} " : "{red ✖} ")
    )
    [suite.ok ? "log" : "groupCollapsed"](title + stats)
}

function displaySuite(current, config) {
  if (current.title !== "#root" && config.verbose === 2) {
    displaySuiteHeader(current, config)
  }

  for (const test of current.tests) displayTest(test, config)
  for (const suite of current.suites) displaySuite(suite, config)

  if (current.title !== "#root" && config.verbose === 2 && !current.ok) {
    log.groupEnd()
  }

  if (current.warnings) {
    warnings.push(...current.warnings.map((arr) => [config.icon, ...arr]))
  }

  if (current.stats.ran === 0 && !current.skip) {
    warnings.push([
      config.icon,
      `No test ran in ${current.title} suite`,
      current.filename,
    ])
  }

  if (current.uncaughts.length > 0) {
    const uncaughts = []

    for (const err of current.uncaughts) {
      if (equal(uncaughts.at(-1)?.err, err)) uncaughts.at(-1).cnt++
      else uncaughts.push({ err, cnt: 0 })
    }

    for (const { err, cnt } of uncaughts) {
      const title = "Uncaught error" + (cnt > 0 ? `s {dim x${cnt}}` : "")
      warnings.push([config.icon, title, "", err])
    }
  }
}

function displayFailedTests(failed, config) {
  if (inBackend) log.hr()
  let sample
  let unshown
  if (config.verbose > 3) {
    sample = failed
    unshown = false
  } else {
    sample = failed.slice(0, config.verbose > 2 ? 6 : 3)
    unshown = failed.length - sample.length
  }

  for (const fail of sample) {
    displayTest(fail, config, { showError: true })
    if (inBackend) log.hr()
  }

  if (unshown) {
    const notice = `[…] {reset.red ${unshown}} unshown failed ${pluralize(
      "test",
      unshown
    )}\n{reset.grey increase verbose level to show more errors}`
    log.red.dim(notice)
    if (inBackend) log.hr()
  }
}

function displayLogs(logs) {
  let previous
  for (const [icon, stackframe, type, args] of logs) {
    if (previous !== stackframe.source) {
      log(`${icon}{blue •} ${log.format.file(stackframe)}`)
      if (inBackend) log.hr()
    }

    console[type](...args)

    if (previous !== stackframe.source) {
      if (inBackend) log.hr().br()
      else log.br()
    }

    previous = stackframe.source
  }
}

function displayWarnings(warnings) {
  for (const [icon, context, stackframe, err] of warnings) {
    const file = stackframe ? ` ${log.format.file(stackframe)}` : ""
    log(`\n${icon}{yellow ⚠ ${context}}${file}`)
    if (err) {
      if (inBackend) log.hr()
      if (inBackend) {
        log(formatError(err))
      } else {
        log.groupCollapsed(formatError(err))
        console.log(err.original)
        log.groupEnd()
      }

      if (inBackend) log.hr().br()
    } else log.br()
  }
}

export default function reportTests(results, options) {
  const config = configure(DEFAULTS, options)
  config.icon = results.icon ? `${results.icon}{blue.dim ›} ` : ""

  failed.length = 0
  logs.length = 0
  warnings.length = 0

  if (config.consoleClear) console.clear()

  if (config.verbose > 1) log()
  displaySuite(results, config)

  const footer = getFooter(results, config)

  if (config.returnInfos) return [footer, failed, logs, warnings]

  if (failed.length > 0) {
    displayFailedTests(failed, config)
  }

  if (warnings.length > 0) {
    displayWarnings(warnings)
  }

  if (logs.length > 0) {
    displayLogs(logs)
  }

  log(footer)
}

reportTests.displayFailedTests = displayFailedTests
reportTests.displayLogs = displayLogs
reportTests.displayWarnings = displayWarnings
