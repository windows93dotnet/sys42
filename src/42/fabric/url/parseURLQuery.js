import allocate from "../locator/allocate.js"

export function parseURLQuery(value, options) {
  if (!(value instanceof URLSearchParams)) {
    value = new URL(value, "file:").searchParams
  }

  const out = {}

  for (let [key, val] of value.entries()) {
    if (val === "") val = true
    else if (options?.parseValue !== false) {
      const parse = options?.parseValue ?? JSON.parse
      try {
        val = parse(val)
      } catch {
        if (val === "undefined") val = undefined
      }
    }

    allocate(out, key, val)
  }

  return out
}

export default parseURLQuery
