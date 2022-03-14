//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

import assertPath from "../assertPath.js"
import { extractBasename } from "./basename.js"

export default function extname(path) {
  assertPath(path)

  path = extractBasename(path)
  const i = path.lastIndexOf(".")
  if (i - 1 === 0 && path.length - 1 === i) return ""
  return i > 0 ? path.slice(i) : ""
}
