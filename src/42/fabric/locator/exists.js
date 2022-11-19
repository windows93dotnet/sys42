import separate from "../type/string/separate.js"

export default function exists(obj, loc, delimiter) {
  return exists.run(obj, separate(loc, delimiter))
}

exists.separate = separate

exists.run = (obj, segments) => {
  let current = obj

  for (const key of segments) {
    if (typeof current !== "object" || key in current === false) return false
    current = current[key]
  }

  return true
}
