import system from "../../system.js"
import configure from "../configure.js"
import inFrontend from "../env/runtime/inFrontend.js"
import { htmlTest } from "../../test.js"

const DEFAULTS = {
  verbose: 1,
  runner: {
    serial: false,
  },
  serializer: {
    title: "line",
    details: "inspect",
    alike: { preset: "inspect", traceNullProto: false },
    diff: "inspect",
    truncateTitleParts: 80,
    keepIframes: false,
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

  const time = performance.now()

  await Promise.all(
    testFiles.map((url) => {
      url = new URL(url, location.href)
      return url.href.endsWith(".html")
        ? inFrontend && htmlTest(url, options)
        : import(/* @vite-ignore */ url)
    })
  )

  await system.testing.run()

  system.testing.root.ms = performance.now() - time
  system.testing.ran = true

  if (config.serialize) return system.testing.serialize(config.serializer)
  if (config.report) {
    system.testing.report(
      await system.testing.serialize(config.serializer),
      config.reporter
    )
  }
}
