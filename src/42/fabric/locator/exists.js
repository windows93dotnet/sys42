import segmentize from "../type/string/segmentize.js"

export default function exists(obj, loc, delimiter) {
  return exists.run(obj, segmentize(loc, delimiter))
}

exists.segmentize = segmentize

exists.run = (obj, segments) => {
  let current = obj

  for (const key of segments) {
    if (typeof current !== "object" || key in current === false) return false
    current = current[key]
  }

  return true
}
