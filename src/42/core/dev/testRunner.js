import { sbs } from "../../test.js"
import configure from "../configure.js"

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

  sbs.started = true
  sbs.ran = false
  sbs.root.reset()

  const time = performance.now()

  await Promise.all(
    testFiles.map((url) => {
      url = new URL(url, location.href)
      return import(url)
    })
  )

  await sbs.run(config.runner)

  sbs.root.ms = performance.now() - time
  sbs.started = false
  sbs.ran = true

  if (config.serialize) return sbs.serialize(config.serializer)
  if (config.report) {
    await sbs.report(await sbs.serialize(config.serializer), config.reporter)
  }
}
