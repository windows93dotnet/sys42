import system from "../../src/42/system.js"

export default function propagateConfig(config) {
  system.configs.shortenFilename.edits({
    base: config.paths.host,
    hostRegex: new RegExp(`^${config.paths.host}/`),
    hostShort: config.paths.dirs.src.replace(config.paths.dirs.cwd, ".") + "/",
  })

  const { fetch } = globalThis

  globalThis.fetch = (url, ...params) => {
    if (typeof url === "string" && url.startsWith("/")) {
      return fetch(config.paths.host + url, ...params)
    }

    return fetch(url, ...params)
  }
}
