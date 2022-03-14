//! Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// @src https://github.com/denoland/deno_std/tree/main/path

import cwd from "../cwd.js"
import assertPath from "../assertPath.js"
import { normalizeString } from "./normalizePath.js"

export default function resolvePath(...segments) {
  let resolvedPath = ""
  let resolvedAbsolute = false

  for (let i = segments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    const path = i >= 0 ? segments[i] : cwd()

    assertPath(path)

    if (path.length === 0) continue

    resolvedPath = `${path}/${resolvedPath}`
    resolvedAbsolute = path.charCodeAt(0) === 47 /* / */
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when cwd() fails)
  // Normalize the path
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute)

  if (resolvedAbsolute) {
    return resolvedPath.length > 0 ? `/${resolvedPath}` : "/"
  }

  return resolvedPath.length > 0 ? resolvedPath : "."
}
