import configure from "../configure.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"

export function tokenize(source) {
  const tokens = []

  let type = "key"
  let buffer = ""
  let current = 0

  const eatWhitespace = () => {
    let i = current
    let n = source.charCodeAt(i)

    while (n === 32 /* space */ && i < source.length - 1) {
      n = source.charCodeAt(++i)
    }

    current = i
  }

  const flush = () => {
    if (buffer) {
      tokens.push({ type, buffer })
      buffer = ""
    } else if (type === "value") {
      tokens.push({ type, buffer: undefined })
      buffer = ""
    }
  }

  let lastCharEscaped = false
  let isNewline = true

  while (current < source.length) {
    const char = source[current]

    if (isNewline) {
      if (char === ";") {
        type = "comment"
        current++
        eatWhitespace()
        continue
      }

      if (char === "[") {
        type = "object"
        current++
        continue
      }

      isNewline = false
    }

    if (lastCharEscaped) {
      lastCharEscaped = false
      buffer += char
      current++
      continue
    }

    if (char === "\\") {
      lastCharEscaped = true
      current++
      continue
    }

    if (char === "[" && source[current + 1] === "]") {
      type = "array"
      flush()
      type = "key"
      current += 2
      eatWhitespace()
      continue
    }

    if (type === "key" && char === " ") {
      current++
      continue
    }

    if (char === "]") {
      flush()
      type = "key"
      current++
      continue
    }

    if (char === "=") {
      flush()
      type = "value"
      current++
      eatWhitespace()
      continue
    }

    if (char === "\r") {
      current++
      continue
    }

    if (char === "\n") {
      isNewline = true
      flush()
      type = "key"
      current++
      continue
    }

    buffer += char
    current++
  }

  flush()

  return tokens
}

const DECODE_DEFAULT = {
  parseValue: JSON.parse,
  delimiter: ".",
  hashmap: true,
}

export function decode(str, options) {
  const config = configure(DECODE_DEFAULT, options)
  const { parseValue } = config
  const out = Object.create(null)

  let key
  let array
  let current = out

  for (const { type, buffer } of tokenize(str)) {
    if (key || array) {
      if (type === "value") {
        let val
        try {
          val = parseValue(buffer)
        } catch {
          val = buffer
        }

        if (array) array.push(val)
        else {
          allocate(current, key, val, config)
          key = undefined
        }

        continue
      } else if (key) {
        allocate(current, key, true, config)
      }
    }

    if (type === "key") {
      if (array) array = undefined
      key = buffer
      continue
    }

    if (type === "object") {
      current = Object.create(null)
      allocate(out, buffer, current, config)
      continue
    }

    if (type === "array") {
      array = locate(current, buffer) ?? []
      if (!Array.isArray(array)) array = [array]
      allocate(current, buffer, array, config)
      continue
    }
  }

  if (key) {
    allocate(current, key, true, config)
  }

  return out
}

export const ini = { decode }
export default ini
