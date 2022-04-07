//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

import assertPath from "../assertPath.js"

export default function dirname(path) {
  assertPath(path)

  if (path.length === 0) return "."
  let code = path.charCodeAt(0)
  const hasRoot = code === 47 /* / */
  let end = -1
  let matchedSlash = true
  for (let i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i)
    if (code === 47 /* / */) {
      if (!matchedSlash) {
        end = i
        break
      }
    } else {
      // We saw the first non-path separator
      matchedSlash = false
    }
  }

  if (end === -1) return hasRoot ? "/" : "."
  if (hasRoot && end === 1) return "//"
  return path.slice(0, end)
}
