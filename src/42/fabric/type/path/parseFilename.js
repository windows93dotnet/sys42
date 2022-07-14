import memoize from "../function/memoize.js"
import assertPath from "./assertPath.js"
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
  assertPath(filename)
  const index = options?.index

  const url = new URL(filename, "file:")
  const out = pick(url, urlKeys)
  out.query = url.search

  out.isURI = out.protocol !== "file:"
  out.isDir = !out.isURI && out.pathname.endsWith("/")
  out.isFile = !out.isURI && !out.isDir

  out.filename = decodeURI(
    index && out.isDir ? `${out.pathname}${index}` : out.pathname
  )

  if (index && out.isDir) {
    out.filename = decodeURI(`${out.pathname}${index}`)
    out.isDir = false
    out.isFile = true
  } else {
    out.filename = decodeURI(out.pathname)
  }

  const parsed = parsePath(out.filename)
  out.dir = parsed.dir
  out.base = parsed.base
  out.ext = out.isDir ? "" : parsed.ext
  out.name = out.isDir ? parsed.base : parsed.name

  if (options?.getURIMimetype === false ? out.isFile : out.ext) {
    out.charset = EXTENSIONS.charset[out.ext] ?? NAMES.charset[out.name]
    out.mimetype =
      EXTENSIONS.mimetype[out.ext] ||
      NAMES.mimetype[out.name] ||
      "application/octet-stream"
  } else if (out.isDir) {
    out.mimetype = "inode/directory"
  } else {
    out.mimetype = "text/x-uri"
  }

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
