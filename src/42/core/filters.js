// @read https://jinja.palletsprojects.com/en/3.0.x/templates/#builtin-filters
// @read https://ansible-docs.readthedocs.io/zh/stable-2.0/rst/playbooks_filters.html

import render from "../ui/render.js"
import locate from "../fabric/locator/locate.js"
import bytesize from "../fabric/type/file/bytesize.js"
import trailZeros from "../fabric/type/number/trailZeros.js"
import dispatch from "../fabric/event/dispatch.js"
import queueTask from "../fabric/type/function/queueTask.js"
import { round, floor, ceil } from "../fabric/type/number/precision.js"
import io from "../io.js"

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

  encodeURI: (str) => encodeURI(str),
  encodeURIComponent: (str) => encodeURIComponent(str),
  decodeURI: (str) => decodeURI(str),
  decodeURIComponent: (str) => decodeURIComponent(str),
}

export function padding(num, decimals, pad) {
  if (!pad || decimals === 0) return num
  const n = String(num)
  const index = n.indexOf(".")
  return `${n.slice(0, index) || "0"}.${n
    .slice(index + 1)
    .padEnd(decimals, "0")}`
}

types.number = {
  ceil: (num, decimals = 0, trailingZeros = true) =>
    decimals === 0
      ? Math.ceil(num)
      : trailingZeros
      ? trailZeros(ceil(num, decimals), decimals)
      : ceil(num, decimals),
  floor: (num, decimals = 0, trailingZeros = true) =>
    decimals === 0
      ? Math.floor(num)
      : trailingZeros
      ? trailZeros(floor(num, decimals), decimals)
      : floor(num, decimals),
  round: (num, decimals = 0, trailingZeros = true) =>
    decimals === 0
      ? Math.round(num)
      : trailingZeros
      ? trailZeros(round(num, decimals), decimals)
      : round(num, decimals),
  add: (a, b) => a + b,
  minus: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  modulo: (a, b) => a % b,
  random: () => Math.random(),
}

// TODO: find a way to register globstar renderer when using filters.array or filters.object
types.array = {
  join: (arr, delimiter) => arr.join(delimiter),
  at: (arr, index) => arr.at(index),
  includes: (arr, search) => arr.includes(search),
  pop: (arr) => arr.pop(),
  shift: (arr) => arr.shift(),
  push: (arr, ...item) => arr.push(...item),
  splice: (arr, ...item) => arr.splice(...item),
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

types.base64 = {
  async encode(val) {
    const base64 = await import("./formats/base64.js") //
      .then(({ base64 }) => base64)
    return base64.encode(val)
  },
  async decode(val) {
    const base64 = await import("./formats/base64.js") //
      .then(({ base64 }) => base64)
    return base64.decode(val)
  },
}

types.any = {
  arrify: "any/arrify",
  cast: "any/cast",
  clone: "any/clone",
  equal: "any/equal",
  stringify: "any/stringify",
  getType: "any/getType",
  async highlight(...args) {
    const [logAsHTML, highlight] = await Promise.all([
      import("./console/logAsHTML.js").then((m) => m.default),
      import("./console/formats/highlight.js").then((m) => m.default),
    ])
    this.el.replaceChildren(logAsHTML(highlight(...args)))
  },
  async trace(...args) {
    const [logAsHTML, highlight, stringify] = await Promise.all([
      import("./console/logAsHTML.js").then((m) => m.default),
      import("./console/formats/highlight.js").then((m) => m.default),
      import("../fabric/type/any/stringify.js").then((m) => m.default),
    ])
    this.el.replaceChildren(logAsHTML(highlight(stringify(...args))))
  },
  log: (...args) => import("./log.js").then(({ log }) => void log(...args)),
  uid: (...args) => import("./uid.js").then(({ uid }) => uid(...args)),
  bytesize: (bytes, options) => bytesize(bytes ?? 0, options),
}

types.function = {
  noop: "function/noop",
}

types.path = {
  // formatPath: "core/formatPath",
  // joinPath: "core/joinPath",
  // normalizePath: "core/normalizePath",
  // parsePath: "core/parsePath",
  postfixPath: "core/postfixPath",
  prefixPath: "core/prefixPath",
  relativePath: "core/relativePath",
  removeExt: "core/removeExt",
  replaceExt: "core/replaceExt",
  resolvePath: "core/resolvePath",
  sortPath: "core/sortPath",

  getExtname: "core/getExtname",
  getDirname: "core/getDirname",
  getBasename: "core/getBasename",
  getStemname: "core/getStemname",
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
}

types.io = io

types.ui = {
  render(item) {
    if (!this.el) return
    this.el.replaceChildren(render(item, this))
  },
  alert: "alert",
  confirm: "confirm",
  prompt: "prompt",
}

types.filePicker = {
  async open(...args) {
    return import("../ui/invocables/filePickerOpen.js") //
      .then((m) => m.default(...args))
  },
  async save(...args) {
    return import("../ui/invocables/filePickerSave.js") //
      .then((m) => m.default(...args))
  },
}

types.field = {
  select(string, field = this.el) {
    field.focus()
    field.setSelectionRange(0, 0)
    if (!string) return
    const { value } = field
    const start = value.indexOf(string)
    start > -1
      ? field.setSelectionRange(start, start + string.length)
      : field.setSelectionRange(0, value.length)
    // needed when document wasn't focused
    queueTask(() => {
      start > -1
        ? field.setSelectionRange(start, start + string.length)
        : field.setSelectionRange(0, value.length)
    })
  },

  async fill(value, field = this.el) {
    const setControlData = await import("../fabric/dom/setControlData.js") //
      .then((m) => m.default)
    setControlData(field, value)
  },

  async sink(rs, field = this.el) {
    if (rs === undefined) return
    const [stream, sinkField] = await Promise.all([
      import("./stream.js").then((m) => m.default),
      import("./stream/sinkField.js").then((m) => m.default),
    ])
    return rs
      .pipeThrough(stream.ts.text())
      .pipeTo(sinkField(field))
      .catch((err) => dispatch(this.el, err))
  },
}

const entries = Object.entries(types)

async function getFilter(item, group, name) {
  let fn = item.url ?? item
  if (typeof fn === "string") {
    fn = await import(
      group === "ui"
        ? `../ui/invocables/${fn}.js` //
        : group === "path"
        ? `../core/path/${fn}.js`
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

export default async function filters(name) {
  for (const [group, val] of entries) {
    if (name in val) {
      const item = val[name]
      return getFilter(item, group, name)
    }
  }

  let segments = locate.segmentize(name)
  if (segments.length === 1) segments = locate.segmentize(name, "/")

  if (segments.length > 1) {
    const item = locate.run(types, segments)
    if (item) return getFilter(item, segments[0], segments[1])
  }
}

Object.assign(filters, types)
