import parseDotNotation from "./parseDotNotation.js"

export default function exists(obj, loc, sep = ".") {
  return exists.tokens(obj, parseDotNotation(loc, sep))
}

exists.tokens = (obj, tokens) => {
  let current = obj

  for (const key of tokens) {
    if (typeof current !== "object" || key in current === false) return false
    current = current[key]
  }

  return true
}
