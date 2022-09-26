export default function tokenizePath(source) {
  const tokens = []
  let buffer = ""
  let current = 0

  const flush = () => {
    if (buffer) {
      tokens.push(buffer)
      buffer = ""
    }
  }

  while (current < source.length) {
    const char = source[current]

    if (char === "/") {
      flush()
      current++
      continue
    }

    buffer += char
    current++
  }

  flush()

  return tokens
}
