import system from "../../system.js"
import configure from "../../fabric/configure.js"
import isFrontend from "../env/runtime/inFrontend.js"
import { htmlTest } from "../../test.js"

const DEFAULTS = {
  verbose: 1,
  runner: {
    serial: false,
    keepIframes: false,
  },
  serializer: {
    title: "line",
    details: "inspect",
    diff: "inspect",
    truncateTitleParts: 80,
  },
  reporter: {
    verbose: undefined,
    consoleClear: false,
  },
  serialize: false,
  report: true,
}

export default async function testRunner(testFiles, options) {
  const config = configure(DEFAULTS, options)
  if (config.reporter.verbose === undefined) {
    config.reporter.verbose = config.verbose
  }

  system.testing.ran = false

  await Promise.all(
    testFiles.map((x) =>
      x.endsWith(".html")
        ? isFrontend && htmlTest(x)
        : import(/* @vite-ignore */ x)
    )
  )

  await system.testing.run()

  system.testing.ran = true

  if (config.serialize) return system.testing.serialize(config.serializer)
  if (config.report) {
    system.testing.report(
      await system.testing.serialize(config.serializer),
      config.reporter
    )
  }
}
