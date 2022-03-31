import extname from "../extract/extname.js"
import basename from "../extract/basename.js"
import dirname from "../extract/dirname.js"
import joinPath from "./joinPath.js"

export default function basePrefix(path, prefix) {
  const type = typeof prefix
  if (type !== "string") {
    throw new TypeError(
      `The "prefix" argument must be a string. Received type ${type}`
    )
  }

  const ext = extname(path)
  const base = basename(path, ext)
  return joinPath(dirname(path), prefix + base + ext)
}
