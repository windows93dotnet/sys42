import extname from "../extract/extname.js"
import basename from "../extract/basename.js"
import dirname from "../extract/dirname.js"
import joinPath from "./joinPath.js"

export default function basePostfix(path, postfix) {
  const type = typeof postfix
  if (type !== "string") {
    throw new TypeError(
      `The "postfix" argument must be a string. Received type ${type}`
    )
  }

  const ext = extname(path)
  const base = basename(path, ext)
  return joinPath(dirname(path), base + postfix + ext)
}
