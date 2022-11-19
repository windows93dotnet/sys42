import separate from "../type/string/separate.js"

export default function locate(obj, loc, delimiter = ".") {
  return locate.run(obj, separate(loc, delimiter))
}

locate.separate = separate

locate.run = (obj, segments, options) => {
  let current = obj

  for (const key of segments) {
    if (
      key.startsWith("-") &&
      key !== "-" &&
      typeof current?.at === "function"
    ) {
      current = current.at(key)
      continue
    }

    if (typeof current !== "object" || key in current === false) return
    if (key === "constructor" || key === "__proto__") return

    current =
      options?.autobind && typeof current[key] === "function"
        ? current[key].bind(current)
        : current[key]
  }

  return current
}
