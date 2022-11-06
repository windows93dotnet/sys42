import patch from "../fabric/json/patch.js"
import isHashmapLike from "../fabric/type/any/is/isHashmapLike.js"

export function merge(dest, origin, memory = new WeakMap()) {
  for (const [key, val] of Object.entries(origin)) {
    if (key === "$patch") {
      patch(dest, val)
      continue
    }

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

export default function configure(...options) {
  const config = {}
  if (options.length === 0) return config

  const memory = new WeakMap()

  for (const opt of options) {
    if (isHashmapLike(opt)) {
      memory.set(opt, config)
      merge(config, opt, memory)
    } else if (opt != null) {
      throw new TypeError(`Arguments must be objects or nullish: ${typeof opt}`)
    }
  }

  return config
}
