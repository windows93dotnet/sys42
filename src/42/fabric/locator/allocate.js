import parseDotNotation from "./parseDotNotation.js"

export default function allocate(obj, loc, value, sep = ".") {
  return allocate.tokens(obj, parseDotNotation(loc, sep), value)
}

allocate.tokens = (obj, tokens, value) => {
  let current = obj

  if (tokens.length === 0) {
    for (const key in obj) delete obj[key]
    return Object.assign(obj, value)
  }

  for (let i = 0, l = tokens.length; i < l; i++) {
    const key = tokens[i]
    current[key] = tokens.length - 1 === i ? value : current[key] ?? {}
    current = current[key]
  }

  return obj
}
