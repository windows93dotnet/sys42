import getExtname from "./getExtname.js"
import getBasename from "./getBasename.js"
import dirname from "./getDirname.js"
import joinPath from "./joinPath.js"

export default function prefixPath(path, prefix) {
  const type = typeof prefix
  if (type !== "string") {
    throw new TypeError(
      `The "prefix" argument must be a string. Received type ${type}`,
    )
  }

  const ext = getExtname(path)
  const base = getBasename(path, ext)
  return joinPath(dirname(path), prefix + base + ext)
}
