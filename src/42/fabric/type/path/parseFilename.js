import memoize from "../function/memoize.js"
import pick from "../object/pick.js"
import parseMimetype from "../file/parseMimetype.js"
import parsePath from "./core/parsePath.js"
import { EXTENSIONS, NAMES } from "../../constants/FILE_TYPES.js"

const urlKeys = [
  "origin",
  "protocol",
  // "username",
  // "password",
  "host",
  "hostname",
  "port",
  "pathname",
  // "search",
  "hash",
  // "href",
]

const parseFilename = memoize((filename, options) => {
  const index = options?.index // ?? "index.html"

  const url = new URL(filename, "file:")
  const out = pick(url, urlKeys)
  out.query = url.search

  out.filename = decodeURI(
    index && out.pathname.endsWith("/")
      ? `${out.pathname}${index}`
      : out.pathname
  )

  const parsed = parsePath(out.protocol === "file:" ? out.filename : "")
  out.dir = parsed.dir
  out.base = parsed.base
  out.ext = parsed.ext
  out.name = parsed.name

  out.charset = EXTENSIONS.charset[out.ext] ?? NAMES.charset[out.name]
  out.mimetype =
    EXTENSIONS.mimetype[out.ext] ||
    NAMES.mimetype[out.name] ||
    parsed.protocol === "file:"
      ? "application/octet-stream"
      : "text/x-uri"

  if (options?.headers) {
    out.headers = {}
    out.headers["content-type"] =
      out.mimetype + (out.charset ? `; charset=${out.charset}` : "")
  }

  if (options?.parseMimetype !== false) {
    out.mime = parseMimetype(out.mimetype)
  }

  return out
})

export default parseFilename
