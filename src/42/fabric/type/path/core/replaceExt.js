import extname from "../extract/extname.js"
import basename from "../extract/basename.js"
import dirname from "../extract/dirname.js"
import joinPath from "./joinPath.js"

export function replaceExt(path, ext) {
  if (path.length === 0) return path
  const nFileName = basename(path, extname(path)) + ext
  return joinPath(dirname(path), nFileName)
}
