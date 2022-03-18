const OBJECT = "[object Object]"

export function merge(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (Array.isArray(val)) {
      target[key] = []
      merge(target[key], val)
    } else if (toString.call(val) === OBJECT) {
      target[key] ??= {}
      merge(target[key], val)
    } else {
      target[key] = val
    }
  }

  return target
}

export default function configure(...options) {
  const config = {}
  if (options.length === 0) return config

  for (const opt of options) {
    if (toString.call(opt) === OBJECT) {
      if (opt) merge(config, opt)
    } else if (opt != null) {
      throw new TypeError(`Arguments must be objects or nullish: ${typeof opt}`)
    }
  }

  return config
}
