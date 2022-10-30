import arrify from "../type/any/arrify.js"

export default function parseDotNotation(source, sep = ".") {
  sep = arrify(sep)
  const tokens = []
  source = String(source)

  if (!source || sep.includes(source)) return tokens

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

    if (sep.includes(char)) {
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
