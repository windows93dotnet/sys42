/* eslint-disable max-params */

import separate from "../type/string/separate.js"

export default function allocate(obj, loc, val, sep = ".", options) {
  return allocate.evaluate(obj, separate(loc, sep), val, options)
}

allocate.parse = separate

allocate.evaluate = (obj, tokens, val, options) => {
  let current = obj

  if (tokens.length === 0) {
    for (const key of Object.keys(obj)) delete obj[key]
    return Object.assign(obj, val)
  }

  for (let i = 0, l = tokens.length; i < l; i++) {
    const key = tokens[i]
    if (key === "__proto__") continue
    if (tokens.length - 1 === i) {
      current[key] = val
    } else {
      current[key] ??= options?.hashmap ? Object.create(null) : {}
      current = current[key]
    }
  }

  return obj
}
