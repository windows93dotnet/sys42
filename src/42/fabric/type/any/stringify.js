/* eslint-disable complexity */

import setup from "../../../system/setup.js"
import uid from "../../uid.js"
import allKeys from "../object/allKeys.js"
import omit from "../object/omit.js"
import pick from "../object/pick.js"
import chainable from "../../trait/chainable.js"
import replaceIndentation from "../string/replaceIndentation.js"
import __p from "../string/pluralize.js"
import { escapeUnicode, unescapeUnicode } from "../string/escapeUnicode.js"
import { joinJSONPointer, joinJSONPointerURI } from "../../json/pointer.js"

const IGNORE_UNICODE = ["↖", "…", "└", "├", "─", "│"].map(
  (x) => `\\${escapeUnicode(x)}`
)
const IGNORE_UNICODE_REGEX = new RegExp(`(${IGNORE_UNICODE.join("|")})`, "g")
const TRAILING_WHITESPACES_REGEX = /([\t ]*)\n/gm

const PRESETS = {
  base: {
    newline: "\n",
    indentSpace: "  ",
    colonSpace: " ",
    lastComma: ",",
  },

  async: {
    async: true,
  },

  list: {
    list: true,
  },

  min: {
    newline: "",
    indentSpace: "",
    colonSpace: "",
    lastComma: "",
    displayNewlines: false,
    addComments: false,
  },

  line: {
    newline: " ",
    indentSpace: "",
    colonSpace: " ",
    lastComma: "",
    displayNewlines: false,
  },

  clean: {
    printWidth: Infinity,
    traceNullProto: false,
    traceDescriptor: false,
    traceHexDump: false,
    addComments: false,
  },

  limit: {
    maxBytes: 256,
    maxChars: 2048,
    maxItems: 32,
    maxLines: 32,
  },

  inspect: {
    list: true,
  },

  sample: {
    list: true,
    printWidth: Infinity,
    displayNewlines: false,
    maxItems: 8,
    maxChars: 40,
  },

  overview: {
    escapeUnicode: true,
    traceProxy: true,
    clean: (res) =>
      res
        .replace(IGNORE_UNICODE_REGEX, unescapeUnicode)
        .replace(TRAILING_WHITESPACES_REGEX, (_, wp) =>
          wp ? `${wp}␊\n` : "\n"
        ),
  },
}

Object.assign(PRESETS.inspect, PRESETS.limit)
Object.assign(PRESETS.inspect, PRESETS.overview)

const DEFAULTS = {
  ignoreKeys: [],
  ignoreGlobalThis: true,
  traceNullProto: true,
  traceProxy: false,
  traceDescriptor: true,
  traceHexDump: true,
  displayNewlines: true,
  addComments: true,
  escapeUnicode: false,
  prefix: false,
  postfix: false,
  asObject: false,
  list: false,
  maxBytes: false,
  maxChars: false,
  maxItems: false,
  maxLines: false,
  // TODO: depth: Infinity,
  printWidth: 80,
  uri: true,
  $ref: "$ref",
  $defs: "$defs",
  $id: "$id",
  ...PRESETS.base,
  clean: (x) => x,
}

const configure = setup("stringify", DEFAULTS, PRESETS)

const makeConfig = (config) => ({
  sp: config.indentSpace,
  nl: config.newline,
  lc: config.lastComma,
  cs: config.colonSpace,
})

const TYPED_ARRAYS = Object.freeze([
  "BigInt64Array",
  "BigUint64Array",
  "Float32Array",
  "Float64Array",
  "Int16Array",
  "Int32Array",
  "Int8Array",
  "Uint16Array",
  "Uint32Array",
  "Uint8Array",
  "Uint8ClampedArray",
])

const EMPTY_BLOB = Symbol("stringify.EMPTY_BLOB")

const WELL_KNOWN_SYMBOLS = []
allKeys(Symbol).forEach((key) => {
  if (typeof Symbol[key] === "symbol") WELL_KNOWN_SYMBOLS.push(`Symbol.${key}`)
})

const escapeString = (val, config, q = '"') => {
  val = val.replaceAll("\\", `\\\\`).replaceAll(q, `\\${q}`)
  return config.escapeUnicode
    ? q === "`"
      ? escapeUnicode(val, [10])
      : escapeUnicode(val)
    : config.displayNewlines === false
    ? val.replaceAll("\n", "\\n")
    : val
}

const limitMessage = (n, word) => `${n} unshown ${__p(word, n)}`

const applyLimit = (items, limit, word = "item") =>
  items.length > limit
    ? {
        items: items.slice(0, limit),
        message: `/* […] ${limitMessage(items.length - limit, word)} */`,
      }
    : { items, message: false }

class Stringifier {
  constructor(options = {}) {
    this.config = configure(options)
    if (this.config.async) this.pendings = []
    this._ = makeConfig(this.config)
    this.altConfigStyle = this._.nl ? PRESETS.line : PRESETS.min
    this.visitedRefs = new WeakMap()
    this.joinPath = this.config.uri ? joinJSONPointerURI : joinJSONPointer
    if (this.config.maxBytes === false) this.config.maxBytes = Infinity
    if (this.config.maxChars === false) this.config.maxChars = Infinity
    if (this.config.maxItems === false) this.config.maxItems = Infinity
  }

  #switchConfig(config) {
    const savedConfig = { ...this._ }
    this._ = makeConfig(config)
    return () => Object.assign(this._, savedConfig)
  }

  walk(val, depth = 1, segments = []) {
    if (val === true) return "true"
    if (val === false) return "false"
    if (val === null) return "null"
    if (val === undefined) return "undefined"

    const type = this.config.asObject && depth === 1 ? "object" : typeof val

    if (type === "object" || type === "function") {
      if (this.config.ignoreGlobalThis && Object.is(val, globalThis)) {
        return "globalThis"
      }

      const objLocation = this.joinPath(segments)
      if (this.visitedRefs.has(val)) {
        const ref = this.visitedRefs.get(val)
        if (ref !== objLocation) {
          const restoreConfig = this.#switchConfig(this.altConfigStyle)
          const comment = this.config.addComments ? "/* [↖] */" : ""
          const { $ref } = this.config
          const out = `${comment}${this._.cs}${this.object({ [$ref]: ref })}`
          restoreConfig()
          return out
        }
      }

      this.visitedRefs.set(val, objLocation)
    }

    if (this.config.list) {
      if (this.retry) this._ = makeConfig(PRESETS.base)
      else if (depth > 1) {
        this._ = makeConfig(PRESETS.line)
        this.config.displayNewlines = false
      }
    }

    let out
    if (type in this) out = this[type](val, depth, segments)

    if (depth === 1 && this.config.list && this.retry !== true) {
      const max = Math.max(...out.split("\n").map((x) => x.length))
      if (max > this.config.printWidth) {
        this.retry = true
        return this.walk(val, depth, segments)
      }
    }

    return out
  }

  number(val) {
    if (Object.is(val, -0)) return "-0"

    if ("DEG_PER_RAD" in Math && val === Math.DEG_PER_RAD) {
      return "Math.DEG_PER_RAD"
    }

    if ("RAD_PER_DEG" in Math && val === Math.RAD_PER_DEG) {
      return "Math.RAD_PER_DEG"
    }

    // prettier-ignore
    switch (val) {
      case Number.MAX_VALUE: return "Number.MAX_VALUE"
      case Number.MIN_VALUE: return "Number.MIN_VALUE"
      case Number.MAX_SAFE_INTEGER: return "Number.MAX_SAFE_INTEGER"
      case Number.MIN_SAFE_INTEGER: return "Number.MIN_SAFE_INTEGER"
      case Number.EPSILON: return "Number.EPSILON"

      case Math.E: return "Math.E"
      case Math.LN2: return "Math.LN2"
      case Math.LN10: return "Math.LN10"
      case Math.LOG2E: return "Math.LOG2E"
      case Math.LOG10E: return "Math.LOG10E"
      case Math.PI: return "Math.PI"
      case Math.SQRT1_2: return "Math.SQRT1_2"
      case Math.SQRT2: return "Math.SQRT2"
      default: return val.toString()
    }
  }

  bigint(val) {
    return val.toString() + "n"
  }

  string(val) {
    let oQ = '"' // openQuote
    let cQ = '"' // closeQuote

    if (this.config.displayNewlines && val.includes("\n")) {
      oQ = "`\\\n"
      cQ = "`"
    }

    if (this.config.maxLines) {
      const lines = val.split("\n")
      if (lines.length > this.config.maxLines) {
        const unshown = lines.length - this.config.maxLines
        return `${oQ}${escapeString(
          lines.slice(0, this.config.maxLines).join("\n"),
          this.config,
          cQ
        )}${cQ} /* […] ${limitMessage(unshown, "line")} */`
      }
    }

    const s = escapeString(val, this.config, cQ)
    const unshown = s.length - this.config.maxChars
    return s.length > this.config.maxChars
      ? `${oQ}${s.slice(0, this.config.maxChars)}${cQ} /* […] ${limitMessage(
          unshown,
          "char"
        )} */`
      : `${oQ}${s}${cQ}`
  }

  symbol(val) {
    const forSymbol = Symbol.keyFor(val)
    if (forSymbol) {
      return `Symbol.for("${escapeString(forSymbol, this.config)}")`
    }

    return val.toString().replace(/Symbol\((.*)\)/, (_, content) => {
      if (WELL_KNOWN_SYMBOLS.includes(content)) return content
      return `Symbol("${escapeString(content, this.config)}")`
    })
  }

  function(val, depth = 1, segments) {
    const source = val
      .toString()
      .replace(/\s*\[native code]\s*/, ' "[native code]" ')

    const keys = Object.keys(val)

    const currentIndent = this.config.indentSpace.repeat(
      keys.length > 0 ? depth : depth - 1
    )

    let fnBody = replaceIndentation(source, currentIndent)

    // force function name visibility
    if (
      this.config.addComments &&
      depth === 1 &&
      val.name &&
      source.startsWith(`function ${val.name}(`) === false &&
      source.startsWith(`class ${val.name} {`) === false
    ) {
      fnBody = `/* ${val.name} */${this._.cs}${fnBody}`
    }

    const proto = Object.getPrototypeOf(val)
    const comment =
      this.config.addComments && proto.constructor.name !== "Function"
        ? `/* ${proto.constructor.name} */${this._.cs}`
        : ""

    const { ignoreKeys, indentSpace } = this.config
    this.config.ignoreKeys = [...ignoreKeys, "length", "name", "prototype"]

    if (keys.length > 0) {
      // prevent methods shorthand syntax in Object.assign()
      if (val.name && fnBody.startsWith(`${val.name}(`)) {
        fnBody = "function " + fnBody
      }

      fnBody = `${comment}Object.assign(
${currentIndent}${fnBody},
${currentIndent}${this.any(val, depth + 1, segments)}
${indentSpace.repeat(depth - 1)})`
    }

    this.config.ignoreKeys = ignoreKeys

    return fnBody
  }

  object(val, depth = 1, segments = []) {
    const proto = Object.getPrototypeOf(val)
    const tag =
      proto === null
        ? this.config.traceNullProto
          ? "Object.create(null)"
          : "Object"
        : Symbol.toStringTag in val
        ? val[Symbol.toStringTag]
        : proto.constructor.name

    if (tag === "Date") return `new Date("${val.toISOString()}")`
    if (tag === "RegExp") return val.toString()
    if (tag === "WeakSet") return "new WeakSet()"
    if (tag === "WeakMap") return "new WeakMap()"

    if (Array.isArray(val)) return this.Array(val, depth, segments, tag)
    if (tag === "Set") return this.Set(val, depth, segments)
    if (tag === "Map") return this.Map(val, depth, segments)
    if (this.config.async) {
      if (tag === "Blob") return this.Blob(val, depth)
      if (tag === "File") return this.Blob(val, depth, "File")
    }

    if (this.config.traceHexDump) {
      if (tag === "ArrayBuffer") {
        const comment = this.config.addComments
          ? `/* ArrayBuffer */${this._.cs}`
          : ""
        return `${comment}${this.hexDump(val, depth)}.buffer`
      }

      if (tag === "Uint8Array" || tag === "Uint8ClampedArray") {
        return this.hexDump(val, depth, tag)
      }
    }

    if (TYPED_ARRAYS.includes(tag)) return this.TypedArray(val, depth, tag)
    if (globalThis.Node && val instanceof globalThis.Node) {
      return this.Node(val, depth, segments, tag)
    }

    return this.any(val, depth, segments, tag)
  }

  Node(val, depth, segments, tag) {
    const keys = allKeys(val)

    const attrs = [
      "prefix",
      "localName",
      "id",
      "className",
      "title",
      "clientHeight",
      "clientLeft",
      "clientTop",
      "clientWidth",
    ].filter((attr) => val[attr])

    const el = pick(val, attrs)

    if (val.style && val.style.cssText) {
      el.style = { cssText: val.style.cssText }
    }

    if (val.dataset && Object.keys(val.dataset).length > 0) {
      el.dataset = { ...val.dataset }
    }

    if (val.tabIndex !== -1) el.tabIndex = val.tabIndex

    if (val.attributes && val.attributes.length > 0) {
      for (let i = val.attributes.length - 1; i--; ) {
        const { name, value } = val.attributes[i]
        if (name.startsWith("data-") || name in el) continue
        el[name] = name in val ? val[name] : value
      }
    }

    if (val.innerHTML) el.innerHTML = val.innerHTML

    const notDisplayed = limitMessage(
      keys.length - Object.keys(el).length,
      "prop"
    )

    let out = ""
    if (this.config.addComments) {
      const childNodesLen = val.childNodes.length
      out += `/* ${tag} > ${childNodesLen} ${__p(
        "childNode",
        childNodesLen
      )} | ${notDisplayed} */ `
    }

    // TODO: rewrite as `Object.assign(document.createElement("${tag}"), {})`
    out += this.any(el, depth, segments)
    return out
  }

  Blob(val, depth = 1, tag = "Blob") {
    const { cs } = this._

    let id =
      val.size > 0 && this.config.addComments ? "/* didn't read lol */" : ""

    if (this.config.async) {
      id = `0x${uid(8, 16)}`
      this.pendings.push(
        val.type.startsWith("text")
          ? new Response(val).text().then((res) => [id, res, depth])
          : new Response(val)
              .arrayBuffer()
              .then((res) => [
                id,
                res.byteLength ? new Uint8Array(res) : EMPTY_BLOB,
                depth,
              ])
      )
    }

    const pickedOptions = pick(val, ["type", "lastModified"])
    if (pickedOptions.type === "") delete pickedOptions.type
    const restoreConfig = this.#switchConfig(this.altConfigStyle)
    let options = this.object(pickedOptions)
    restoreConfig()

    options = options === "{}" ? "" : `,${cs}${options}`
    const name = tag === "File" ? `,${cs}"${val.name}"` : ""
    return `new ${tag}([${id}]${name}${options})`
  }

  any(val, depth = 1, segments = [], tag = "Object") {
    const keys = allKeys(val, true)

    let { sp, nl, lc, cs } = this._
    const indent = sp.repeat(depth)
    const baseIndent = sp.repeat(depth - 1)
    let body = ""
    let foot = ""

    if (tag === "Object.create(null)") {
      if (keys.length === 0) return "Object.create(null)"
      tag = "Object.assign(Object.create(null), "
      foot = ")"
    } else {
      tag =
        tag === "Object"
          ? ""
          : typeof this.config.prefix === "string"
          ? this.config.prefix
          : this.config.addComments &&
            (this.config.traceProxy || tag !== "Proxy")
          ? `/* ${tag} */ `
          : ""
    }

    if (this.config.$id && keys.includes(this.config.$id)) {
      segments.length = 0
    }

    if (this.config.$defs && keys.includes(this.config.$defs)) {
      const $defs = val[this.config.$defs]
      if ($defs && typeof $defs === "object") {
        for (const [key, val] of Object.entries($defs)) {
          if (val && typeof val === "object") {
            this.visitedRefs.set(
              val,
              this.joinPath([...segments, this.config.$defs, String(key)])
            )
          }
        }
      }
    }

    const { items, message } = applyLimit(keys, this.config.maxItems)
    lc = message ? `${lc}${nl}${indent}${message}` : lc

    items.forEach((key, i, arr) => {
      if (this.config.ignoreKeys.includes(key)) return

      const keyName =
        typeof key === "string"
          ? /^([$A-Z_a-z][\w$]*|\d+)$/.test(key) // @related https://github.com/estools/esutils
            ? key || '""'
            : `"${escapeString(key, this.config)}"`
          : `[${this.symbol(key)}]`

      // console.log(key)
      // const item = val[key]
      let item
      try {
        item = val[key]
      } catch {
        // console.warn(err)
        return
      }

      // if (this.config.traceDescriptor) {
      //   const desc = Object.getOwnPropertyDescriptor(val, key)
      //   if (desc) {
      //     if (desc.enumerable === false) {
      //       console.log(desc)
      //     }

      //     if (desc.get) {
      //       item = desc.get
      //       console.log(item)
      //     }
      //   }
      // }

      const res = this.walk(item, depth + 1, [...segments, String(key)])
      let keyAndVal = `${keyName}:${cs}${res}`

      if (typeof item === "function") {
        // detect methods shorthand syntax
        if (res.startsWith(`get ${keyName}(`)) keyAndVal = res
        else if (res.startsWith(`${keyName}(`)) keyAndVal = res
        else if (item.name && item.name !== key) {
          if (res.startsWith(`${item.name}(`)) {
            // add `function` keyword
            // for functions that was declared with method shorthand syntax
            // and transferred to another object with a different key.
            // To prevent wrong syntax like :
            // { newKey: oldKey() {} }
            keyAndVal = `${keyName}:${cs}function ${res}`
          } else if (
            this.config.addComments &&
            res.startsWith(`function ${item.name}(`) === false &&
            res.startsWith(`class ${item.name} {`) === false
          ) {
            // force function name visibility
            // to prevent test runners to display
            // similar strings after a deepEqual test fail
            keyAndVal = `${keyName}:${cs}/* ${item.name} */${cs}${res}`
          }
        }
      }

      const comma = i === arr.length - 1 ? lc : ","

      body += `${nl}${indent}${keyAndVal}${comma}`
    })

    body = body ? `${body}${nl}${baseIndent}` : ""
    return `${tag}{${body}}${this.config.postfix || ""}${foot}`
  }

  Map(val, depth = 1, segments = []) {
    if (val.size > 0) {
      let { sp, nl, lc } = this._
      const indent = sp.repeat(depth)
      const baseIndent = sp.repeat(depth - 1)

      // Force "condensed" formating in Map
      // (could be optional)
      const restoreConfig = this.#switchConfig(this.altConfigStyle)
      const { items, message } = applyLimit([...val], this.config.maxItems)
      const mapBody = items.map((item) => this.walk(item, depth + 1, segments))
      lc = message ? `${lc}${nl}${indent}${message}` : lc
      restoreConfig()

      const body = mapBody.join(`,${nl}${indent}`)
      return `new Map([${nl}${indent}${body}${lc}${nl}${baseIndent}])`
    }

    return "new Map()"
  }

  Set(val, depth = 1, segments = []) {
    return `new Set(${
      val.size > 0 ? this.walk([...val], depth, segments) : ""
    })`
  }

  Array(val, depth = 1, segments = [], tag = "Array") {
    const cName = tag
    const len = val.length
    tag = tag === "Array" ? "" : `/* ${tag} */ `
    if (len > 0) {
      let { sp, nl, lc } = this._
      // eslint-disable-next-line no-prototype-builtins
      if (val.every((item, i) => !val.hasOwnProperty(i))) {
        return `new ${cName}(${len})`
      }

      const indent = sp.repeat(depth)
      const { items, message } = applyLimit(val, this.config.maxItems)
      lc = message ? `${lc}${nl}${indent}${message}` : lc
      const arrayBody = items
        .map((item, i) => this.walk(item, depth + 1, [...segments, String(i)]))
        .join(`,${nl}${indent}`)
      const baseIndent = sp.repeat(depth - 1)
      return `${tag}[${nl}${indent}${arrayBody}${lc}${nl}${baseIndent}]`
    }

    return `${tag}[]`
  }

  TypedArray(val, depth = 1, tag = "TypedArray") {
    const cName = tag
    const len = val.length
    if (len > 0) {
      const { sp, nl, lc } = this._
      if (val.every((item) => item === 0x0)) {
        return `new ${cName}(${len})`
      }

      const indent = sp.repeat(depth)
      const arrayBody = val.join(`,${nl}${indent}`)
      const baseIndent = sp.repeat(depth - 1)
      return `new ${tag}([${nl}${indent}${arrayBody}${lc}${nl}${baseIndent}])`
    }

    return `new ${tag}([])`
  }

  hexDump(val, depth = 1, tag = "Uint8Array") {
    // @read https://nielsleenheer.com/articles/2017/the-case-for-console-hex/
    try {
      val = new Uint8Array(val)
    } catch (err) {
      if (err.message.includes("detached ArrayBuffer")) {
        return `"[detached ArrayBuffer]"`
      }

      throw err
    }

    const len = val.length
    if (len > 0) {
      const { sp, nl, lc } = this._
      if (val[0] === 0x0 && len < 255 && val.every((item) => item === 0x0)) {
        return `new ${tag}(${len})`
      }

      const indent = sp.repeat(depth)
      let arrayBody = ""
      let max = len
      let suffix = ""
      if (max > this.config.maxBytes) {
        max = this.config.maxBytes
        suffix = `\n${indent}/* […] ${limitMessage(len - max, "byte")} */`
      }

      if (max >= 4096) throw new Error(`too many bytes to stringify: ${max}`)

      let middleSpace = 1

      for (let i = 0; i < max; i++) {
        arrayBody += `0x${val[i].toString(16).padStart(2, "0")},`
        if (i % 16 === 15 || i === max - 1) {
          if (this.config.addComments && this.config.displayNewlines) {
            arrayBody += " ".repeat((15 - (i % 16)) * 5 + middleSpace) + " // "
            Array.from(val)
              .splice(i - (i % 16), 16)
              .forEach((v) => {
                arrayBody += v > 31 && v < 127 ? String.fromCharCode(v) : "."
              })
          }

          if (i !== max - 1) arrayBody += `${nl}${indent}`
          middleSpace = 1
        } else if (i % 8 === 7) {
          middleSpace = 0
          if (sp) arrayBody += " "
        }
      }

      if (lc === "") arrayBody = arrayBody.slice(0, -1)

      const baseIndent = sp.repeat(depth - 1)
      return `new ${tag}([${nl}${indent}${arrayBody}${suffix}${nl}${baseIndent}])`
    }

    return `new ${tag}([])`
  }
}

const normalizeOptions = (options) =>
  typeof options === "string" ? { preset: options } : options

const stringify = chainable(
  Object.keys(PRESETS),
  ({ entries }, val, options = {}) => {
    for (const [key] of entries) {
      options = { ...normalizeOptions(options), ...PRESETS[key] }
    }

    if (options.async === true) {
      return (async () => {
        const s1 = new Stringifier(options)
        let string = s1.walk(val)
        const resolved = await Promise.all(s1.pendings)
        const s2 = new Stringifier(omit(options, ["async"]))
        resolved.forEach(([uid, res, depth]) => {
          string = string.replace(
            uid,
            res === EMPTY_BLOB ? "" : s2.walk(res, depth)
          )
        })
        return s1.config.clean(string)
      })()
    }

    const s = new Stringifier(options)
    return s.config.clean(s.walk(val))
  }
)

export default stringify
