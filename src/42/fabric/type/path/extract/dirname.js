//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

import assertPath from "../assertPath.js"

function findDirname(path, hasRoot) {
  const i = path.lastIndexOf("/")

  if (i === -1) return "."
  if (i === 0) return "/"
  if (i === path.length - 1) return findDirname(path.slice(0, -1), hasRoot)
  if (hasRoot && i === 1) return "//"
  return path.slice(0, i)
}

export default function dirname(path) {
  assertPath(path)

  if (path.length === 0) return "."
  const hasRoot = path.charCodeAt(0) === 47 /* / */

  return findDirname(path, hasRoot)
}
