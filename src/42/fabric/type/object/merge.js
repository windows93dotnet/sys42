import isHashmapLike from "../any/is/isHashmapLike.js"

export function merge(target, source, memory = new WeakMap()) {
  for (const [key, val] of Object.entries(source)) {
    if (memory.has(val)) {
      target[key] = memory.get(val)
    } else if (Array.isArray(val)) {
      target[key] = []
      memory.set(val, target[key])
      merge(target[key], val, memory)
    } else if (isHashmapLike(val)) {
      if (target[key] === null || typeof target[key] !== "object") {
        target[key] = {}
      }

      memory.set(val, target[key])
      merge(target[key], val, memory)
    } else {
      target[key] = val
    }
  }

  return target
}

export default merge
