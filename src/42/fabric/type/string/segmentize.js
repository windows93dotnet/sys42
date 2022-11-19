import arrify from "../any/arrify.js"

export default function segmentize(source, delimiters = ".") {
  if (!delimiters) return [source]
  delimiters = arrify(delimiters)
  const segments = []
  source = String(source)

  if (!source || delimiters.includes(source)) return segments

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

    if (delimiters.includes(char)) {
      if (current !== 0 && current !== source.length - 1) {
        segments.push(buffer)
        buffer = ""
      }

      current++
      continue
    }

    buffer += char
    current++
  }

  segments.push(buffer)

  return segments
}
