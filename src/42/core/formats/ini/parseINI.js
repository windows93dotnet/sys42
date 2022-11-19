export const SPECIAL_CHARS = [";", "#", "[", "]", "="]

export function parseINI(source, delimiters = []) {
  const tokens = []

  let type = "key"
  let buffer = ""
  let current = 0

  const specialChars = new Set([...SPECIAL_CHARS, ...delimiters])

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

    if (char === "\\") {
      if (specialChars.has(source[current + 1])) {
        lastCharEscaped = true
        current++
        continue
      }

      buffer += char
      current++
      continue
    }

    if (lastCharEscaped) {
      lastCharEscaped = false
      buffer += char
      current++
      continue
    }

    if (isNewline) {
      if (char === ";") {
        type = "comment"
        current++
        eatWhitespace()
        continue
      }

      if (char === "[") {
        type = "section"
        current++
        continue
      }

      isNewline = false
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

export default parseINI
