/* eslint-disable no-useless-concat */

// @read https://jinja.palletsprojects.com/en/3.0.x/templates/#builtin-filters
// @read https://ansible-docs.readthedocs.io/zh/stable-2.0/rst/playbooks_filters.html

import locate from "../fabric/locator/locate.js"
import bytesize from "../fabric/type/file/bytesize.js"
import dispatch from "../fabric/event/dispatch.js"
import { round, floor, ceil } from "../fabric/type/number/precision.js"

const types = {}

const MANIPULATION = { url: "string/manipulation", key: true }
const COUNT = { url: "string/count", key: true }
const TRIM = { url: "string/trim", key: true }

types.string = {
  camelCase: MANIPULATION,
  capitalCase: MANIPULATION,
  constantCase: MANIPULATION,
  headerCase: MANIPULATION,
  kebabCase: MANIPULATION,
  lowerCase: MANIPULATION,
  nocaseCase: MANIPULATION,
  pascalCase: MANIPULATION,
  sentenceCase: MANIPULATION,
  snakeCase: MANIPULATION,
  titleCase: MANIPULATION,
  upperCase: MANIPULATION,

  nospace: MANIPULATION,
  slice: MANIPULATION,
  split: MANIPULATION,
  repeat: MANIPULATION,
  replace: MANIPULATION,
  replaceAll: MANIPULATION,
  padEnd: MANIPULATION,
  padStart: MANIPULATION,
  endsWith: MANIPULATION,
  startsWith: MANIPULATION,

  deburr: "string/deburr",
  pluralize: "string/pluralize",

  countLetters: COUNT,
  countWords: COUNT,
  countBytes: COUNT,

  trim: TRIM,
  trimStart: TRIM,
  trimEnd: TRIM,
}

export function padding(num, decimals, pad) {
  if (!pad || decimals === 0) return num
  const n = String(num)
  const index = n.indexOf(".")
  return `${n.slice(0, index) || "0"}.${n
    .slice(index + 1)
    .padEnd(decimals, "0")}`
}

// prettier-ignore
types.number = {
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
types.array = {
  join: (arr, sep) => arr.join(sep),
  at: (arr, index) => arr.at(index),
  includes: (arr, search) => arr.includes(search),
  pop: (arr) => arr.pop(),
  shift: (arr) => arr.shift(),
  push: (arr, ...item) => arr.push(...item),
  slice: MANIPULATION,
  difference: "array/difference",
  groupBy: "array/groupBy",
  removeItem: "array/removeItem",
  shuffle: "array/shuffle",
  union: "array/union",
  uniq: "array/uniq",
}

types.object = {
  fromEntries: (obj) => Object.fromEntries(obj),
  entries: (obj) => Object.entries(obj),
  keys: (obj) => Object.keys(obj),
  values: (obj) => Object.values(obj),
  locate: (...args) => locate(...args),
  allKeys: "object/allKeys",
  omit: "object/omit",
  pick: "object/pick",
}

types.any = {
  arrify: "any/arrify",
  cast: "any/cast",
  clone: "any/clone",
  equal: "any/equal",
  stringify: "any/stringify",
  log: (...args) => import("./log.js").then((m) => m.default(...args)),
}

types.function = {
  noop: "function/noop",
}

types.path = {
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
  sortPath: "path/core/sortPath",

  extname: "path/extract/extname",
  dirname: "path/extract/dirname",
  basename: "path/extract/basename",
  stemname: "path/extract/stemname",
}

types.fs = {
  async open(path, fallback = "") {
    if (path === undefined) return fallback
    const fs = await import("./fs.js").then((m) => m.default)
    try {
      return await fs.open(path)
    } catch (err) {
      dispatch(this.el, err)
      return fallback
    }
  },
  async read(path, fallback = "") {
    if (path === undefined) return fallback
    const fs = await import("./fs.js").then((m) => m.default)
    try {
      return await fs.readText(path)
    } catch (err) {
      dispatch(this.el, err)
      return fallback
    }
  },
  async source(path) {
    const [fs, sinkField] = await Promise.all([
      import("./fs.js").then((m) => m.default),
      import("../fabric/type/stream/sinkField.js").then((m) => m.default),
    ])
    fs.source(path, "utf8")
      .pipeTo(sinkField(this.el))
      .catch((err) => {
        dispatch(this.el, err)
      })
  },
}

types.file = {
  text: async (file) => file?.text?.(),
  arrayBuffer: async (file) => file?.arrayBuffer?.(),
  bytesize: (file, options) => bytesize(file?.size ?? 0, options),
}

types.ui = {
  async render(item) {
    if (typeof item === "string" && item.contains("{" + "{")) return item
    const render = await import("../ui/render.js").then((m) => m.default)
    queueMicrotask(() => {
      if (!this.el) return
      this.el.replaceChildren(render(item, this))
    })
  },
  prompt: "prompt",
}

const entries = Object.entries(types)

export default async function filters(name) {
  for (const [group, val] of entries) {
    if (name in val) {
      const item = val[name]
      let fn = item.url ?? item
      if (typeof fn === "string") {
        fn = await import(
          group === "ui"
            ? `../ui/invocables/${fn}.js` //
            : `../fabric/type/${fn}.js`
        ).then((m) =>
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

Object.assign(filters, types)
