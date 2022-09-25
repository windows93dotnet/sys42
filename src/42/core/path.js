import format from "../core/path/core/formatPath.js"
import join from "../core/path/core/joinPath.js"
import normalize from "../core/path/core/normalizePath.js"
import parse from "../core/path/core/parsePath.js"
import resolve from "../core/path/core/resolvePath.js"
import sort from "../core/path/core/sortPath.js"
import relative from "../core/path/core/relativePath.js"

import dirname from "../core/path/core/getDirname.js"
import extname from "../core/path/core/getExtname.js"
import basename from "../core/path/core/getBasename.js"

import isAbsolute from "../core/path/utils/isAbsolute.js"
import hasTrailingSlash from "../core/path/utils/hasTrailingSlash.js"

export default {
  format,
  join,
  normalize,
  parse,
  resolve,
  sort,
  relative,

  basename,
  dirname,
  extname,

  isAbsolute,
  hasTrailingSlash,
}
