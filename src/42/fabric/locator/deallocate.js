import separate from "../type/string/separate.js"

export default function deallocate(obj, loc, sep = ".") {
  return deallocate.evaluate(obj, separate(loc, sep))
}

deallocate.parse = separate

deallocate.evaluate = (obj, tokens) => {
  let current = obj

  if (tokens.length === 0) {
    for (const key in obj) if (Object.hasOwn(obj, key)) delete obj[key]
    return obj
  }

  for (let i = 0, l = tokens.length; i < l; i++) {
    const key = tokens[i]
    if (typeof current !== "object" || key in current === false) return obj

    if (tokens.length - 1 === i) {
      delete current[key]
      return obj
    }

    current = current[key]
  }

  return obj
}
