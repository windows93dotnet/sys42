import parseExpression from "../template/parseExpression.js"

export default function parseTemplate(source, jsonParser) {
  const strings = []
  const substitutions = []
  let buffer = ""
  let current = 0

  while (current < source.length) {
    const char = source[current]

    if (char === "{" && source[current + 1] === "{") {
      let i = current + 2

      let n = source.charCodeAt(i)
      let expr = ""

      let lastCharEscaped = false

      do {
        expr += source[i]
        i++
        n = source.charCodeAt(i)

        if (lastCharEscaped) {
          lastCharEscaped = false
          continue
        }

        if (n === 92 /* \ */) {
          lastCharEscaped = true
          continue
        }
      } while (
        (n !== 125 /* } */ || source.charCodeAt(i + 1) !== 125) &&
        i + 1 < source.length
      )

      if (source.charCodeAt(i++) === 125 && source.charCodeAt(i++) === 125) {
        strings.push(buffer)
        buffer = ""

        substitutions.push(parseExpression(expr, jsonParser))

        current = i
        continue
      }
    }

    buffer += char
    current++
  }

  strings.push(buffer)

  return { strings, substitutions }
}
