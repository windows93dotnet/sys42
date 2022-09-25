//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

import assertPath from "../assertPath.js"
import resolvePath from "./resolvePath.js"

function trim(arr) {
  let start = 0
  for (; start < arr.length; start++) {
    if (arr[start] !== "") break
  }

  let end = arr.length - 1
  for (; end >= 0; end--) {
    if (arr[end] !== "") break
  }

  if (start > end) return []
  return arr.slice(start, end - start + 1)
}

export default function relativePath(from, to) {
  assertPath(from)
  assertPath(to)

  if (from === to) return ""

  from = resolvePath(from).slice(1)
  to = resolvePath(to).slice(1)

  const fromParts = trim(from.split("/"))
  const toParts = trim(to.split("/"))

  const length = Math.min(fromParts.length, toParts.length)
  let samePartsLength = length
  let i
  for (i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i
      break
    }
  }

  let outputParts = []
  for (i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push("..")
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength))

  return outputParts.join("/")
}
