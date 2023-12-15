import memoize from "../../fabric/type/function/memoize.js"
import pick from "../../fabric/type/object/pick.js"
import parseMimetype from "../../fabric/type/file/parseMimetype.js"
import parsePath from "./core/parsePath.js"
import { extnames, basenames } from "../../fabric/constants/FILE_TYPES.js"

const urlKeys = [
  "origin",
  "protocol",
  // "username",
  // "password",
  "host",
  "hostname",
  "port",
  "pathname",
  "search",
  "hash",
  // "href",
]

const getPathInfos = memoize((filename, options) => {
  const index = options?.index

  const url = new URL(filename, "file:")
  const out = pick(url, urlKeys)

  const isFileProtocol = out.protocol === "file:"
  if (isFileProtocol) out.origin = "file://" // firefox fix
  out.isURI = !isFileProtocol
  out.isDir = !out.isURI && out.pathname.endsWith("/")
  out.isFile = !out.isURI && !out.isDir

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
  out.stem = out.isDir ? parsed.base : parsed.name

  out.charset = undefined

  if (out.isDir) {
    out.mimetype = "inode/directory"
  } else {
    const infos =
      extnames[out.ext.toLowerCase()] ?? basenames[out.base.toLowerCase()]
    if (infos) {
      out.charset = infos.charset
      out.mimetype = infos.mimetype
    } else {
      out.mimetype = "application/octet-stream"
    }

    if (options?.getURIMimetype === false && out.isURI) {
      out.mimetype = "text/x-uri"
    }
  }

  if (options?.headers) {
    out.headers = { ...options.headers }
    out.headers["Content-Type"] ??=
      out.mimetype + (out.charset ? `; charset=${out.charset}` : "")
  }

  if (options?.parseMimetype !== false) {
    out.mime = parseMimetype(out.mimetype)
  }

  return out
})

export default getPathInfos
