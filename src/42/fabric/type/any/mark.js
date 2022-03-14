/* eslint-disable complexity */
/* eslint-disable eqeqeq */

import { isIterable, isArray, isPlainObjectOrHashmap } from "./is.js"
import allKeys from "../object/allKeys.js"

export default function mark(value) {
  if (value == undefined) return String(value)
  const type = typeof value
  if (type === "string") return `"${value}"`
  if (type === "number" || type === "boolean") return String(value)
  if (type === "bigint") return `${value}n`

  if (isArray(value)) {
    return value.length > 0
      ? `[${value.map(mark).join()}]`
      : `[${mark(value[0])}]`
  }

  if (isPlainObjectOrHashmap(value)) {
    const keys = allKeys(value)
    return `{${keys
      .map((key) => `${key.toString()}:${mark(value[key])}`)
      .join()}}`
  }

  if ("Blob" in globalThis && value instanceof Blob) {
    return "File" in globalThis && value.constructor === File
      ? `new File([],"${value.name}",{size:${value.size},type:"${
          value.type
        }",lastModified:${value.lastModified},webkitRelativePath:"${
          value.webkitRelativePath || ""
        }"})`
      : `new Blob([],{size:${value.size},type:"${value.type}"})`
  }

  if ("Node" in globalThis && value instanceof Node) {
    return value.outerHTML
  }

  let closeTag = ""
  if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value)
    closeTag = ".buffer"
  }

  if (isIterable(value)) {
    return `new ${value.constructor.name}([${[...value]
      .map(mark)
      .join()}])${closeTag}`
  }

  if (type === "symbol") {
    const key = Symbol.keyFor(value)
    return key ? `Symbol.for(${key})` : value.toString()
  }

  if (typeof value.toString === "function") {
    return `${value.constructor?.name}#${value.toString()}`
  }

  return "<unknown>"
}
