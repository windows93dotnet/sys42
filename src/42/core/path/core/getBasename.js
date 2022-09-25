/* eslint-disable max-depth */
/* eslint-disable complexity */
//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

import assertPath from "../assertPath.js"

export default function getBasename(path, ext) {
  if (ext !== undefined && typeof ext !== "string") {
    throw new TypeError('"ext" argument must be a string')
  }

  assertPath(path)

  let start = 0
  let end = -1
  let matchedSlash = true
  let i

  if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
    if (ext.length === path.length && ext === path) return ""
    let extIdx = ext.length - 1
    let firstNonSlashEnd = -1
    for (i = path.length - 1; i >= 0; --i) {
      const code = path.charCodeAt(i)
      if (code === 47 /* / */) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1
          break
        }
      } else {
        if (firstNonSlashEnd === -1) {
          // We saw the first non-path separator, remember this index in case
          // we need it if the extension ends up not matching
          matchedSlash = false
          firstNonSlashEnd = i + 1
        }

        if (extIdx >= 0) {
          // Try to match the explicit extension
          if (code === ext.charCodeAt(extIdx)) {
            if (--extIdx === -1) {
              // We matched the extension, so mark this as the end of our path
              // component
              end = i
            }
          } else {
            // Extension does not match, so our result is the entire path
            // component
            extIdx = -1
            end = firstNonSlashEnd
          }
        }
      }
    }

    if (start === end) end = firstNonSlashEnd
    else if (end === -1) end = path.length
    return path.slice(start, end)
  }

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /* / */) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        start = i + 1
        break
      }
    } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false
      end = i + 1
    }
  }

  if (end === -1) return ""
  return path.slice(start, end)
}
