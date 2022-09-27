/* eslint-disable max-params */

import parseDotNotation from "./parseDotNotation.js"

export default function allocate(obj, loc, val, sep = ".", options) {
  return allocate.evaluate(obj, parseDotNotation(loc, sep), val, options)
}

allocate.parse = parseDotNotation

allocate.evaluate = (obj, tokens, val, options) => {
  let current = obj

  if (tokens.length === 0) {
    for (const key of Object.keys(obj)) delete obj[key]
    return Object.assign(obj, val)
  }

  for (let i = 0, l = tokens.length; i < l; i++) {
    const key = tokens[i]
    if (tokens.length - 1 === i) {
      current[key] = val
    } else {
      current[key] ??= options?.hashmap ? Object.create(null) : {}
      current = current[key]
    }
  }

  return obj
}
