/* eslint-disable no-useless-concat */

// @read https://jinja.palletsprojects.com/en/3.0.x/templates/#builtin-filters
// @read https://ansible-docs.readthedocs.io/zh/stable-2.0/rst/playbooks_filters.html

import locate from "./locator/locate.js"
// import locate from "./locator/allocate.js"
import bytesize from "./type/file/bytesize.js"
import dispatch from "./dom/dispatch.js"
import { round, floor, ceil } from "./type/number/precision.js"

const filters = {}

const STRING_FILTER = { url: "string/stringFilters", key: true }

filters.string = {
  slice: STRING_FILTER,
  replace: STRING_FILTER,
  nospace: STRING_FILTER,
  deburr: "string/deburr",
  pluralize: "string/pluralize",
  camel: STRING_FILTER,
  capital: STRING_FILTER,
  constant: STRING_FILTER,
  header: STRING_FILTER,
  kebab: STRING_FILTER,
  lower: STRING_FILTER,
  nocase: STRING_FILTER,
  pascal: STRING_FILTER,
  sentence: STRING_FILTER,
  snake: STRING_FILTER,
  title: STRING_FILTER,
  upper: STRING_FILTER,
  split: (str, sep) => str.split(sep),
  endsWith: (str, search) => str.endsWith(search),
  startsWith: (str, search) => str.startsWith(search),
  padStart: (str, length, padString) => str.padStart(length, padString),
  padEnd: (str, length, padString) => str.padEnd(length, padString),
}

function padding(num, precision, pad) {
  if (!pad || precision === 0) return num
  const [a, b] = String(num).split(".")
  return a + "." + (b ?? "0").padEnd(precision, "0")
}

// prettier-ignore
filters.number = {
  ceil: (num, decimals = 0, pad = true) => padding(ceil(num, decimals), decimals, pad),
  floor: (num, decimals = 0, pad = true) => padding(floor(num, decimals), decimals, pad),
  round: (num, decimals = 0, pad = true) => padding(round(num, decimals), decimals, pad),
  add: (a, b) => a + b,
  minus: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  modulo: (a, b) => a % b,
}

// TODO: find a way to register globstar renderer when using filters.array or filters.object
filters.array = {
  join: (arr, sep) => arr.join(sep),
  at: (arr, index) => arr.at(index),
  includes: (arr, search) => arr.includes(search),
  slice: STRING_FILTER,
  difference: "array/difference",
  groupBy: "array/groupBy",
  removeItem: "array/removeItem",
  shuffle: "array/shuffle",
  union: "array/union",
  uniq: "array/uniq",
}

filters.object = {
  fromEntries: (obj) => Object.fromEntries(obj),
  entries: (obj) => Object.entries(obj),
  keys: (obj) => Object.keys(obj),
  values: (obj) => Object.values(obj),
  locate: (...args) => locate(...args),
  allKeys: "object/allKeys",
  omit: "object/omit",
  pick: "object/pick",
}

filters.any = {
  arrify: "any/arrify",
  cast: "any/cast",
  clone: "any/clone",
  equal: "any/equal",
  stringify: "any/stringify",
}

filters.path = {
  // formatPath: "path/core/formatPath",
  // joinPath: "path/core/joinPath",
  // normalizePath: "path/core/normalizePath",
  // parsePath: "path/core/parsePath",
  postfixPath: "path/core/postfixPath",
  prefixPath: "path/core/prefixPath",
  relativePath: "path/core/relativePath",
  removeExt: "path/core/removeExt",
  replaceExt: "path/core/replaceExt",
  resolvePath: "path/core/resolvePath",
  // sortGlobResults: "path/core/sortGlobResults",
  sortPath: "path/core/sortPath",

  extname: "path/extract/extname",
  dirname: "path/extract/dirname",
  basename: "path/extract/basename",
  stemname: "path/extract/stemname",
}

filters.file = {
  async open(path, fallback = "") {
    if (path === undefined) return fallback
    const fs = await import("../core/fs.js").then((m) => m.default)
    try {
      return await fs.open(path)
    } catch (err) {
      dispatch(this.el, err)
      return fallback
    }
  },
  async read(path, fallback = "") {
    if (path === undefined) return fallback
    const fs = await import("../core/fs.js").then((m) => m.default)
    try {
      return await fs.readText(path)
    } catch (err) {
      dispatch(this.el, err)
      return fallback
    }
  },
  text: async (file) => file?.text?.(),
  arrayBuffer: async (file) => file?.arrayBuffer?.(),
  size: (file, options) => bytesize(file?.size ?? 0, options),
}

filters.ui = {
  async render(item) {
    if (typeof item === "string" && item.contains("{" + "{")) return item
    const render = await import("../ui/render.js").then((m) => m.default)
    queueMicrotask(() => {
      if (!this.el) return
      this.el.replaceChildren(render(item, this))
    })
  },
}

const entries = Object.entries(filters)

export default async function getFilter(name) {
  for (const [, val] of entries) {
    if (name in val) {
      const item = val[name]
      let fn = item.url ?? item
      if (typeof fn === "string") {
        fn = await import(`./type/${fn}.js`).then((m) =>
          item.key
            ? locate(m.default, name)
            : item.import
            ? locate(m, item.import)
            : m.default
        )
      }

      return fn
    }
  }
}
