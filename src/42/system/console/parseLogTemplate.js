export default function parseLogTemplate(source) {
  const tokens = []
  let buffer = ""
  let current = 0

  let type = "text"
  let nested = 0
  let lastCharEscaped = false

  const flush = () => {
    if (buffer) {
      tokens.push({ type, buffer, nested })
      buffer = ""
    }
  }

  const match = (reg) => {
    reg.lastIndex = current + 1
    return reg.test(source)
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

    if (type === "style" && char === " ") {
      flush()
      type = "text"
      current++
      continue
    }

    if (char === "{" && match(/[\d#().A-Za-z]{3,} /y)) {
      flush()
      type = "style"
      nested++
      current++
      continue
    }

    if (nested > 0 && char === "}") {
      flush()
      type = "text"
      nested--
      current++
      continue
    }

    buffer += char
    current++
  }

  flush()

  return tokens
}
