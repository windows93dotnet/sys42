import extname from "./getExtname.js"
import getBasename from "./getBasename.js"
import dirname from "./getDirname.js"
import joinPath from "./joinPath.js"

export function replaceExt(path, ext) {
  if (path.length === 0) return path
  const nFileName = getBasename(path, extname(path)) + ext
  return joinPath(dirname(path), nFileName)
}
