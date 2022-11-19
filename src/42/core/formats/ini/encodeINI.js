import isHashmapLike from "../../../fabric/type/any/is/isHashmapLike.js"
import isEmptyObject from "../../../fabric/type/any/is/isEmptyObject.js"
import configure from "../../configure.js"

const DEFAULT = {
  stringifyValue: JSON.stringify,
  delimiter: ".",
  whitespace: "",
  undefined: "",
  eol: "\n",
}

export function encodeINI(obj, options, prev = "") {
  const config = configure(DEFAULT, options)
  const { stringifyValue, delimiter } = config
  const ws = config.whitespace === true ? " " : config.whitespace
  const { eol } = config

  let out = ""

  const sections = []

  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      if (config.undefined === false) continue
      out += `${key}${ws}=${ws}${config.undefined}${eol}`
    } else if (isHashmapLike(val)) {
      sections.push([key, val])
    } else {
      out += `${key}${ws}=${ws}${
        typeof val === "string" ? val : stringifyValue(val)
      }${eol}`
    }
  }

  for (const [key, val] of sections) {
    const section = prev ? `${prev}${delimiter}${key}` : key

    if (isEmptyObject(val)) {
      if (out) out += eol
      out += `[${section}]${eol}`
      continue
    }

    const sub = encodeINI(val, options, section)

    if (Object.values(val).every((item) => isHashmapLike(item))) {
      out += sub
    } else if (sub) {
      if (out) out += eol
      out += `[${section}]${eol}`
      out += sub
    }
  }

  return out
}

export default encodeINI
