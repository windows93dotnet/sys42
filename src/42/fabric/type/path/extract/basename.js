//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

import assertPath from "../assertPath.js"

export function extractBasename(path, ext) {
  if (path === ext) return ""
  const i = path.lastIndexOf("/")

  if (i === -1) return path

  const res =
    i === path.length - 1
      ? extractBasename(path.slice(0, -1), ext)
      : path.slice(i + 1)

  if (res === ext) return res
  if (ext && res.slice(-1 * ext.length) === ext) {
    return res.slice(0, res.length - ext.length)
  }

  return res
}

export default function basename(path, ext) {
  assertPath(path)

  if (ext !== undefined && typeof ext !== "string") {
    throw new TypeError('The "ext" argument must be a string')
  }

  return extractBasename(path, ext)
}
