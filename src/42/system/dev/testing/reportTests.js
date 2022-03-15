import configure from "../../../fabric/configure.js"
import isBackend from "../../env/runtime/inBackend.js"
import log from "../../../log.js"
import highlight from "../../console/formats/highlight.js"
import formatFilename from "../../console/formats/formatFilename.js"
import formatError from "../../console/formats/formatError.js"
import truncate from "../../../fabric/type/string/truncate.js"
import __p from "../../../fabric/type/string/pluralize.js"
import { escapeLog } from "../../console/logUtils.js"

const DEFAULTS = {
  verbose: 1,
  consoleClear: false,
}

const failed = []
const logs = []
const warnings = []

const getSuiteTitle = ({ title, skip }, highlightLast) =>
  title
    .split("/")
    .filter((x) => x !== ".")
    .map(
      (x, i, arr) =>
        `{${skip ? "magenta.dim" : "white"}${
          skip ? "" : highlightLast && i === arr.length - 1 ? "" : ".dim"
        } ${escapeLog(x)}}`
    )
    .join(` {${skip ? "magenta.dim" : "grey"} ›} `)

const getTestTitle = ({ title, ok, skip }) =>
  title
    .map(
      (x) => `{${skip ? "magenta.dim" : ok ? "reset" : "red"} ${escapeLog(x)}}`
    )
    .join(` {${skip ? "magenta.dim" : "white.dim"} ·} `)
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
    end = ` {grey.dim •} {white.dim ${Math.round(ms)}}{grey ms}`
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
    onlies > 0 ? ` {red ┈ ${onlies} ${__p("only suite", onlies)} ┈}\n` : "\n"

  return footer
}

const displayTest = (test, config, showError) => {
  test.icon ??= config.icon ?? ""

  let title = `${getSuiteTitle({
    title: test.suiteTitle,
    skip: test.skip,
  })} {${test.skip ? "magenta.dim" : "grey"} ›} `
  title += getTestTitle(test)

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
  if (test.error) {
    if (showError) {
      err += "\n\n"
      err += formatError(test.error, {
        entries: {
          newline: "\n\n",
          valueFormater: (x) =>
            typeof x === "string"
              ? highlight(x)
              : "\n{dim.grey ┌╴}\n{dim.grey │} " +
                formatError(x, { compact: true })
                  .replaceAll("\n", "\n{dim.grey │} ")
                  .replace(/│} $/, "└╴} "),
        },
      })
    } else {
      failed.push(test)
    }
  }

  if (test.logs) logs.push(...test.logs.map((arr) => [test.icon, ...arr]))

  if (showError || config.verbose > 2) {
    let prefix =
      test.icon +
      (test.skip ? "{magenta.dim ~} " : test.ok ? "{green ✔} " : "{red ✖} ")
    if (showError) prefix = `\n${prefix}`
    log(prefix + title + err)
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
    .log(title + stats)
}

function displaySuite(current, config) {
  if (current.title !== "#root" && config.verbose === 2) {
    displaySuiteHeader(current, config)
  }

  for (const test of current.tests) displayTest(test, config)
  for (const suite of current.suites) displaySuite(suite, config)

  if (current.warnings) {
    warnings.push(...current.warnings.map((arr) => [config.icon, ...arr]))
  }

  if (current.stats.ran === 0 && !current.skip) {
    warnings.push([
      config.icon,
      `no test ran in ${current.title} suite`,
      current.filename,
    ])
  }
}

function displayFailedTests(failed, config) {
  if (isBackend) log.hr()
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
    displayTest(fail, config, true)
    if (isBackend) log.hr()
  }

  if (unshown) {
    const notice = `[…] {reset.red ${unshown}} unshown failed ${__p(
      "test",
      unshown
    )}\n{reset.grey increase verbose level to show more errors}`
    log.red.dim(notice)
    if (isBackend) log.hr()
  }
}

function displayLogs(logs) {
  for (const [icon, stackframe, type, args] of logs) {
    log(`${icon}{blue •} ${log.format.file(stackframe)}`)
    if (isBackend) log.hr()
    console[type](...args)
    if (isBackend) log.hr().br()
    else log.br()
  }
}

function displayWarnings(warnings) {
  for (const [icon, context, stackframe, err] of warnings) {
    const file = stackframe ? ` ${log.format.file(stackframe)}` : ""
    log(`${icon}{yellow ⚠ ${context}}${file}`)
    if (err) {
      if (isBackend) log.hr()
      log(formatError(err))
      if (isBackend) log.hr().br()
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
