import isHashmapLike from "../any/is/isHashmapLike.js"

export default function merge(dest, source, memory = new WeakMap()) {
  for (const [key, val] of Object.entries(source)) {
    if (memory.has(val)) {
      dest[key] = memory.get(val)
    } else if (Array.isArray(val)) {
      dest[key] = []
      memory.set(val, dest[key])
      merge(dest[key], val, memory)
    } else if (isHashmapLike(val)) {
      if (dest[key] === null || typeof dest[key] !== "object") {
        dest[key] = {}
      }

      memory.set(val, dest[key])
      merge(dest[key], val, memory)
    } else {
      dest[key] = val
    }
  }

  return dest
}
