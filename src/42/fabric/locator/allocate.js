import segmentize from "../type/string/segmentize.js"

/**
 * Set value in object using path
 * @param {Object} obj
 * @param {string} path
 * @param {*} val
 * @param {Object|string} [options] - Delimiter if string
 * @param {string|array<string>} [options.delimiter=.]
 * @param {boolean} [options.hashmap=false]
 * @returns {Object} obj
 */
export default function allocate(obj, path, val, options) {
  if (typeof options === "string") options = { delimiter: options }
  return allocate.run(obj, segmentize(path, options?.delimiter), val, options)
}

allocate.segmentize = segmentize

allocate.run = (obj, segments, val, options) => {
  let current = obj

  if (segments.length === 0) {
    for (const key of Object.keys(obj)) delete obj[key]
    return Object.assign(obj, val)
  }

  for (let i = 0, l = segments.length; i < l; i++) {
    const key = segments[i]
    if (key === "__proto__") continue
    if (segments.length - 1 === i) {
      current[key] = val
    } else {
      if (key in current && !Object.hasOwn(current, key)) {
        // never change prototype chain
        current[key] = options?.hashmap ? Object.create(null) : {}
      } else current[key] ??= options?.hashmap ? Object.create(null) : {}
      current = current[key]
    }
  }

  return obj
}
