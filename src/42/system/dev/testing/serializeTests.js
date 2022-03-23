import system from "../../../system.js"
import configure from "../../../fabric/configure.js"
import stringify from "../../../fabric/type/any/stringify.js"
import truncate from "../../../fabric/type/string/truncate.js"
import sortPath from "../../../fabric/type/path/core/sortPath.js"
import { calcPatch } from "../../../fabric/algorithm/myersDiff.js"
import diff from "../../../fabric/json/diff.js"
import serializeError from "../../../fabric/type/error/serializeError.js"

const DEFAULTS = {
  title: "line",
  details: "inspect",
  alike: { preset: "inspect", traceNullProto: false },
  diff: "sample",
  truncateTitleParts: 80,
}

const castTestTitleParts = async (arg, config) =>
  truncate(
    (typeof arg === "string" ? arg : await stringify(arg, config.title)).trim(),
    config.truncateTitleParts
  )

async function serializeTest(test, config) {
  test.title = await Promise.all(
    test.title
      .filter((x) => x !== undefined)
      .map((x) => castTestTitleParts(x, config))
  )
  if (test.error) {
    let tmpDiff

    const { details } = test.error
    if (
      "actual" in details &&
      "expected" in details &&
      details.actual instanceof Error !== false
    ) {
      if (
        typeof details.actual === "string" &&
        typeof details.expected === "string"
      ) {
        tmpDiff = [...calcPatch(details.expected, details.actual)]
      } else {
        // TODO: test diff blob
        tmpDiff = diff(details.actual, details.expected)
      }
    }

    const stringifyDetailsOptions = test.error.message.includes("alike")
      ? config.alike
      : config.details

    test.error.details = Object.fromEntries(
      await Promise.all(
        Object.entries(test.error.details).map(async ([key, value]) => [
          key,
          value instanceof Error
            ? serializeError(value)
            : await stringify.async(value, stringifyDetailsOptions),
        ])
      )
    )

    if (
      tmpDiff &&
      !(
        tmpDiff.length === 1 && // ignore full diff
        tmpDiff[0].op === "replace" &&
        tmpDiff[0].path === ""
      )
    ) {
      test.error.details.diff = stringify(tmpDiff, config.diff)
    }
  }
}

async function serializeSuite(suite, config) {
  await Promise.all([
    Promise.all(suite.tests.map((x) => serializeTest(x, config))),
    Promise.all(suite.suites.map((x) => serializeSuite(x, config))),
  ])

  return suite
}

export default async function serializeTests(options) {
  const config = configure(DEFAULTS, options)
  const { root } = system.testing
  const results = await serializeSuite(root.toJSON(), config)
  results.suites = sortPath(results.suites, "filename")
  return results
}
