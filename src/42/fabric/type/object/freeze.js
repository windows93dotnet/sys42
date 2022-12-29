// @thanks https://github.com/substack/deep-freeze

function walk(obj, visiteds) {
  visiteds.add(obj)

  for (const key of Object.getOwnPropertyNames(obj)) {
    const type = typeof obj[key]
    if (
      obj[key] !== null &&
      (type === "object" || type === "function") &&
      !visiteds.has(obj[key])
    ) {
      walk(obj[key], visiteds)
    }
  }

  return Object.freeze(obj)
}

export function freeze(obj) {
  return walk(obj, new WeakSet())
}

export default freeze
