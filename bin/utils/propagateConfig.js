import system from "../../src/42/system.js"

export default function propagateConfig(config) {
  system.configs.shortenFilename.edits({
    base: config.paths.host,
    hostRegex: new RegExp(`^${config.paths.host}/`),
    hostShort: config.paths.dirs.src.replace(config.paths.dirs.cwd, ".") + "/",
  })
}
