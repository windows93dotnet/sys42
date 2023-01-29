import isHashmapLike from "../any/is/isHashmapLike.js"

export function merge(target, source, options, memory = new WeakMap()) {
  for (const [key, val] of Object.entries(source)) {
    if (memory.has(val)) {
      target[key] = options?.simplify
        ? Array.isArray(memory.get(val))
          ? []
          : {}
        : memory.get(val)
    } else if (Array.isArray(val)) {
      target[key] = []
      memory.set(val, target[key])
      merge(target[key], val, options, memory)
    } else if (isHashmapLike(val)) {
      if (target[key] === null || typeof target[key] !== "object") {
        target[key] = {}
      }

      memory.set(val, target[key])
      merge(target[key], val, options, memory)
    } else if (options?.simplify) {
      const type = typeof val
      target[key] =
        val && (type === "object" || type === "function" || type === "symbol")
          ? options?.simplify(val, { target, source, options, memory })
          : val
    } else {
      target[key] = val
    }
  }

  return target
}

export default merge
