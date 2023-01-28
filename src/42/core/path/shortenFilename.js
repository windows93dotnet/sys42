import inBackend from "../env/runtime/inBackend.js"
import settings from "../settings.js"
import arrify from "../../fabric/type/any/arrify.js"
import getCWD from "./cwd.js"

const origin = globalThis?.location?.origin
const host = origin ?? "https?://localhost:(\\d{2,4})"
const cwd = getCWD()
const base = origin ?? `file://${cwd}/`

const DEFAULTS = {
  ignoreParams: ["t"],
  base,
  rootRegex: new RegExp(`^${cwd}/`),
  rootShort: "./",
  hostRegex: new RegExp(`^${host}/`),
  hostShort: "/",
  object: false,
}

const configure = settings("shortenFilename", DEFAULTS)

export default function shortenFilename(str, options) {
  if (typeof options === "string") options = { base: options }
  const config = configure(options)

  if (inBackend && str.startsWith(cwd)) config.base = "file://"

  const url = new URL(str, config.base)

  if (config.ignoreParams === true) {
    url.search = ""
  } else {
    for (const item of arrify(config.ignoreParams)) {
      url.searchParams.delete(item)
    }
  }

  let filename = decodeURI(url.href)

  if (config.hostRegex) {
    filename = filename.replace(config.hostRegex, config.hostShort)
  }

  if (inBackend) {
    filename = filename.replace("file://", "")
  }

  if (config.rootRegex) {
    filename = filename.replace(config.rootRegex, config.rootShort)
  }

  return config.object
    ? { filename, href: url.href, protocol: url.protocol }
    : filename
}
