import separate from "../type/string/separate.js"

export default function exists(obj, loc, sep) {
  return exists.evaluate(obj, separate(loc, sep))
}

exists.parse = separate

exists.evaluate = (obj, tokens) => {
  let current = obj

  for (const key of tokens) {
    if (typeof current !== "object" || key in current === false) return false
    current = current[key]
  }

  return true
}
