import getExtname from "./getExtname.js"
import getBasename from "./getBasename.js"
import dirname from "./getDirname.js"
import joinPath from "./joinPath.js"

export default function postfixPath(path, postfix) {
  const type = typeof postfix
  if (type !== "string") {
    throw new TypeError(
      `The "postfix" argument must be a string. Received type ${type}`
    )
  }

  const ext = getExtname(path)
  const base = getBasename(path, ext)
  return joinPath(dirname(path), base + postfix + ext)
}
