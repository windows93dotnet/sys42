/* eslint-disable complexity */
/* eslint-disable eqeqeq */

import { isIterable, isArray, isPlainObjectOrHashmap } from "./is.js"
import allKeys from "../object/allKeys.js"

/**
 * Converts any value into a readable, most unique possible string.
 *
 * @param {*} val
 * @returns {string}
 */
export default function mark(val, memory = new WeakSet()) {
  if (val == undefined) return String(val)
  const type = typeof val
  if (type === "string") return `"${val}"`
  if (type === "boolean") return String(val)
  if (type === "number") {
    return Object.is(val, -0) ? "-0" : val ? String(val) : "+0"
  }

  if (type === "bigint") return `${val}n`

  if (memory.has(val)) return "↖"

  if (isArray(val)) {
    memory.add(val)
    return val.length > 0
      ? `[${val.map((x) => mark(x, memory)).join()}]`
      : `[${mark(val[0], memory)}]`
  }

  if (isPlainObjectOrHashmap(val)) {
    memory.add(val)
    const keys = allKeys(val)
    return `{${keys
      .map((key) => `${key.toString()}:${mark(val[key], memory)}`)
      .join()}}`
  }

  if ("Blob" in globalThis && val instanceof Blob) {
    return "File" in globalThis && val.constructor === File
      ? `new File([],"${val.name}",{size:${val.size},type:"${
          val.type
        }",lastModified:${val.lastModified},webkitRelativePath:"${
          val.webkitRelativePath || ""
        }"})`
      : `new Blob([],{size:${val.size},type:"${val.type}"})`
  }

  if ("Element" in globalThis && val instanceof Element) {
    return val.outerHTML
  }

  if ("Node" in globalThis && val instanceof Node) {
    return `${val.constructor?.name}#${val.textContent || val.nodeName}`
  }

  let closeTag = ""
  if (val instanceof ArrayBuffer) {
    val = new Uint8Array(val)
    closeTag = ".buffer"
  }

  if (isIterable(val)) {
    return `new ${val.constructor.name}([${("byteLength" in val
      ? [...val]
      : [...val].map((x) => mark(x, memory))
    ).join()}])${closeTag}`
  }

  if (type === "symbol") {
    const key = Symbol.keyFor(val)
    return key ? `Symbol.for(${key})` : val.toString()
  }

  if (typeof val.toString === "function") {
    return `${val.constructor?.name}#${val.toString()}`
  }

  if (typeof val.toJSON === "function") {
    return `${val.constructor?.name}#${val.toJSON()}`
  }

  return "<unknown>"
}
