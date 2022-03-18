export default function parseCommand(source) {
  const tokens = []
  let buffer = ""
  let current = 0

  const flush = () => {
    if (buffer) {
      tokens.push(buffer)
      buffer = ""
    }
  }

  let inSingleQuote = false
  let inDoubleQuote = false
  let lastCharEscaped = false

  while (current < source.length) {
    const char = source[current]

    if (char === "\\") {
      lastCharEscaped = true
      current++
      continue
    }

    if (lastCharEscaped) {
      lastCharEscaped = false
      buffer += char
      current++
      continue
    }

    if (!inDoubleQuote && !inSingleQuote && char === " ") {
      flush()
      current++
      continue
    }

    if (!inDoubleQuote && char === "'") {
      inSingleQuote = !inSingleQuote
      current++
      continue
    }

    if (!inSingleQuote && char === '"') {
      inDoubleQuote = !inDoubleQuote
      current++
      continue
    }

    buffer += char
    current++
  }

  flush()

  return tokens
}
