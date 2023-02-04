import isHashmapLike from "../any/is/isHashmapLike.js"

export function traverse(obj, cb, parentKey, memory = new WeakSet()) {
  if (parentKey === undefined && !(obj && typeof obj === "object")) return obj

  memory.add(obj)

  for (const [key, val] of Object.entries(obj)) {
    cb(key, val, obj, parentKey)
    if ((isHashmapLike(val) || Array.isArray(val)) && !memory.has(val)) {
      traverse(val, cb, key, memory)
    }
  }

  return obj
}

export default traverse
