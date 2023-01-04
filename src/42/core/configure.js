import patch from "../fabric/json/patch.js"
import isHashmapLike from "../fabric/type/any/is/isHashmapLike.js"

export function merge(target, source, memory = new WeakMap()) {
  for (const [key, val] of Object.entries(source)) {
    if (key === "$patch") {
      patch(target, val)
      continue
    }

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

export default function configure(...options) {
  const config = {}
  if (options.length === 0) return config

  const memory = new WeakMap()

  for (const opt of options) {
    if (isHashmapLike(opt)) {
      memory.set(opt, config)
      merge(config, opt, memory)
    } else if (!(opt == null || typeof opt === "boolean")) {
      throw new TypeError(
        `Arguments must be objects, boolean or nullish: ${typeof opt}`
      )
    }
  }

  return config
}
