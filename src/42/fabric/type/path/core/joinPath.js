//! Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// @src https://github.com/denoland/deno_std/tree/main/path

import assertPath from "../assertPath.js"
import normalize from "./normalizePath.js"

export default function join(...paths) {
  if (paths.length === 0) return "."
  let joined
  for (let i = 0, len = paths.length; i < len; ++i) {
    const path = paths[i]
    assertPath(path)
    if (path.length > 0) {
      if (joined) joined += `/${path}`
      else joined = path
    }
  }

  if (!joined) return "."
  return normalize(joined)
}
