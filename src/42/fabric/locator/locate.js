import parseDotNotation from "./parseDotNotation.js"

export default function locate(obj, loc, sep = ".") {
  return locate.evaluate(obj, parseDotNotation(loc, sep))
}

locate.parse = parseDotNotation

locate.evaluate = (obj, tokens) => {
  let current = obj

  for (const key of tokens) {
    if (
      key.startsWith("-") &&
      key !== "-" &&
      typeof current?.at === "function"
    ) {
      current = current.at(key)
      continue
    }

    if (typeof current !== "object" || key in current === false) return
    current = current[key]
  }

  return current
}
