import isHashmapLike from "../../../fabric/type/any/is/isHashmapLike.js"
import configure from "../../configure.js"

const DEFAULT = {
  stringifyValue: JSON.stringify,
  sectionDelimiter: ".",
  ignoreUndefined: false,
  whitespace: false,
  eol: "\n",
}

export function encodeINI(obj, options) {
  const config = configure(DEFAULT, options)
  const { stringifyValue } = config
  const ws = config.whitespace ? " " : ""
  const { eol } = config

  let out = ""

  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      if (config.ignoreUndefined) continue
      out += `${key}${ws}=${ws}undefined${eol}`
    } else if (isHashmapLike(val)) {
      console.log(111, val)
    } else {
      out += `${key}${ws}=${ws}${stringifyValue(val)}${eol}`
    }
  }

  return out
}

export default encodeINI
