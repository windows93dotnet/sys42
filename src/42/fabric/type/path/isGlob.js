// @src https://github.com/jonschlinkert/is-glob
// @src https://github.com/jonschlinkert/is-extglob
//! Copyright (c) 2014-2017, Jon Schlinkert. MIT License.

const chars = { "{": "}", "(": ")", "[": "]" }
const GLOB_REGEX =
  /\\(.)|(^!|\*|[)+.\]]\?|\[[^\\\]]+]|{[^\\}]+}|\(\?[!:=][^)\\]+\)|\([^|]+\|[^)\\]+\))/

export function isExtglob(str) {
  if (typeof str !== "string" || str === "") {
    return false
  }

  let match
  while ((match = /(\\).|([!*+?@]\(.*\))/g.exec(str))) {
    if (match[2]) return true
    str = str.slice(match.index + match[0].length)
  }

  return false
}

export default function isGlob(str) {
  if (typeof str !== "string" || str === "") {
    return false
  }

  if (isExtglob(str)) return true

  let match
  while ((match = GLOB_REGEX.exec(str))) {
    if (match[2]) return true
    let idx = match.index + match[0].length

    // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character
    const open = match[1]
    const close = open ? chars[open] : false
    if (open && close) {
      const n = str.indexOf(close, idx)
      if (n !== -1) idx = n + 1
    }

    str = str.slice(idx)
  }

  return false
}
