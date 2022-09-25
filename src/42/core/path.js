import format from "../fabric/type/path/core/formatPath.js"
import join from "../fabric/type/path/core/joinPath.js"
import normalize from "../fabric/type/path/core/normalizePath.js"
import parse from "../fabric/type/path/core/parsePath.js"
import resolve from "../fabric/type/path/core/resolvePath.js"
import sort from "../fabric/type/path/core/sortPath.js"
import relative from "../fabric/type/path/core/relativePath.js"

import dirname from "../fabric/type/path/core/getDirname.js"
import extname from "../fabric/type/path/core/getExtname.js"
import basename from "../fabric/type/path/core/getBasename.js"

import isAbsolute from "../fabric/type/path/utils/isAbsolute.js"
import hasTrailingSlash from "../fabric/type/path/utils/hasTrailingSlash.js"

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
