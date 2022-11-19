import JSON5 from "./json5.js"
import decode from "./ini/decodeINI.js"
import encode from "./ini/encodeINI.js"

export const ini = {
  decode: (str, options) =>
    decode(str, { parseValue: JSON5.parse, ...options }),

  encode: (str, options) =>
    encode(str, { stringifyValue: JSON5.stringify, ...options }),
}

export default ini
