import memoize from "../function/memoize.js"
import parsePath from "./core/parsePath.js"
import { EXTENSIONS, NAMES } from "../../constants/FILE_TYPES.js"

const parseFilename = memoize((filename, index = "index.html") => {
  const obj = new URL(filename, "file:")

  obj.filename = decodeURI(
    index && obj.pathname.endsWith("/")
      ? `${obj.pathname}${index}`
      : obj.pathname
  )

  obj.query = obj.search

  const parsed = parsePath(obj.filename)
  obj.dir = parsed.dir
  obj.base = parsed.base
  // obj.ext = parsed.ext.slice(1)
  obj.ext = parsed.ext
  obj.name = parsed.name

  obj.charset = EXTENSIONS.charset[obj.ext] ?? NAMES.charset[obj.name]
  obj.mimetype =
    EXTENSIONS.mimetype[obj.ext] ||
    NAMES.mimetype[obj.name] ||
    "application/octet-stream"

  obj.headers = Object.create(null)
  obj.headers["content-type"] =
    obj.mimetype + (obj.charset ? `; charset=${obj.charset}` : "")

  return obj
})

export default parseFilename
