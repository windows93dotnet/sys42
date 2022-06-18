export default function parseDotNotation(source, sep = ".") {
  const tokens = []
  source = String(source)

  if (!source || source === sep) return tokens

  let buffer = ""
  let current = 0

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

    if (char === sep) {
      if (current !== 0 && current !== source.length - 1) {
        tokens.push(buffer)
        buffer = ""
      }

      current++
      continue
    }

    buffer += char
    current++
  }

  tokens.push(buffer)

  return tokens
}
