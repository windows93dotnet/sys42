export default function parseAbbreviation(source, defaultTag = "div") {
  const tokens = []
  let buffer = ""
  let current = 0

  let type = "element"
  let lastCharEscaped = false

  const flush = () => {
    if (buffer) tokens.push({ type, buffer })
    else if (type === "element") tokens.push({ type, buffer: defaultTag })
    buffer = ""
  }

  while (current < source.length) {
    const char = source[current]

    if (char === "\\") {
      lastCharEscaped = true
      const nextChar = source[current + 1]
      if (nextChar !== "{" && nextChar !== "}") buffer += char
      current++
      continue
    }

    if (lastCharEscaped) {
      lastCharEscaped = false
      buffer += char
      current++
      continue
    }

    if (char === ".") {
      flush()
      type = "class"
      current++
      continue
    }

    if (char === "#") {
      flush()
      type = "id"
      current++
      continue
    }

    buffer += char
    current++
  }

  flush()

  return tokens
}
