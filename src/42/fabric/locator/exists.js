import parseDotNotation from "./parseDotNotation.js"

export default function exists(obj, loc, sep) {
  return exists.evaluate(obj, parseDotNotation(loc, sep))
}

exists.parse = (loc, sep) => parseDotNotation(loc, sep)

exists.evaluate = (obj, tokens) => {
  let current = obj

  for (const key of tokens) {
    if (typeof current !== "object" || key in current === false) return false
    current = current[key]
  }

  return true
}
