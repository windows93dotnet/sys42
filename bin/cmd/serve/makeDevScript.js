import system from "../../../src/42/system.js"
import escapeHTML from "../../../src/42/fabric/type/string/escapeHTML.js"

import parseUserAgent from "../../../src/42/core/env/parseUserAgent.js"
import memoize from "../../../src/42/fabric/type/function/memoize.js"

const getUserAgent = memoize(parseUserAgent)

let { devScript } = system.config.paths.files
devScript = devScript.replace(system.config.paths.dirs.src, "")
devScript = devScript.replaceAll("\\", "/")

export default function makeDevScript(asset, ua) {
  const entry = asset.filename.slice(system.config.paths.dirs.src.length)
  const config = { entry, verbose: system.config.verbose }

  if (system.testFiles) {
    const { engine } = getUserAgent(ua)
    const testContext =
      engine.name === "Gecko"
        ? "firefox"
        : engine.name === "WebKit"
        ? "webkit"
        : "chromium"

    const testFiles =
      system.testFiles?.[testContext] ?? system.testFiles?.browser

    if (testFiles) {
      config.testRunner =
        system.config.tasks.test[testContext] ??
        system.config.tasks.test.frontend
      config.testFiles = testFiles
    }
  }

  const dataConfig = escapeHTML(JSON.stringify(config))

  return `<!-- [42] --><script async type="module" data-config="${dataConfig}" src="${devScript}"></script>`
}
