/* eslint-disable max-depth */
/* eslint-disable complexity */

//! Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// @src https://github.com/denoland/deno_std/tree/main/path

import assertPath from "../assertPath.js"

const CHAR_DOT = 46 /* . */
const CHAR_FORWARD_SLASH = 47 /* / */

// Resolves . and .. elements in a path with directory names
export function normalizeString(path, allowAboveRoot) {
  let res = ""
  let lastSegmentLength = 0
  let lastSlash = -1
  let dots = 0
  let code
  for (let i = 0, len = path.length; i <= len; ++i) {
    if (i < len) code = path.charCodeAt(i)
    else if (code === CHAR_FORWARD_SLASH) break
    else code = CHAR_FORWARD_SLASH

    if (code === CHAR_FORWARD_SLASH) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/")
            if (lastSlashIndex === -1) {
              res = ""
              lastSegmentLength = 0
            } else {
              res = res.slice(0, lastSlashIndex)
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/")
            }

            lastSlash = i
            dots = 0
            continue
          } else if (res.length === 2 || res.length === 1) {
            res = ""
            lastSegmentLength = 0
            lastSlash = i
            dots = 0
            continue
          }
        }

        if (allowAboveRoot) {
          if (res.length > 0) res += `/..`
          else res = ".."
          lastSegmentLength = 2
        }
      } else {
        if (res.length > 0) res += "/" + path.slice(lastSlash + 1, i)
        else res = path.slice(lastSlash + 1, i)
        lastSegmentLength = i - lastSlash - 1
      }

      lastSlash = i
      dots = 0
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots
    } else {
      dots = -1
    }
  }

  return res
}

export default function normalizePath(path) {
  assertPath(path)

  if (path.length === 0) return "."

  const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH
  const trailingSeparator =
    path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH

  // Normalize the path
  path = normalizeString(path, !isAbsolute)

  if (path.length === 0 && !isAbsolute) path = "."
  if (path.length > 0 && trailingSeparator) path += "/"

  if (isAbsolute) return `/${path}`
  return path
}
