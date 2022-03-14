import parseFunctionCall from "./parseFunctionCall.js"

export default function parseTemplate(source, jsonParser) {
  const strings = []
  const substitutions = []
  const filters = []
  let buffer = ""
  let current = 0

  while (current < source.length) {
    const char = source[current]

    if (char === "{" && source[current + 1] === "{") {
      let i = current + 2

      let n = source.charCodeAt(i)
      const keys = []
      const filterKeys = []
      let list = keys
      let key = ""

      do {
        key += source[i]
        i++
        n = source.charCodeAt(i)

        if (n === 124 /* | */) {
          const filter = key.trim()
          list.push(filter)
          list = filterKeys
          key = ""
          i++
        }
      } while (
        (n !== 125 /* } */ || source.charCodeAt(i + 1) !== 125) &&
        i + 1 < source.length
      )

      list.push(key.trim())

      if (source.charCodeAt(i++) === 125 && source.charCodeAt(i++) === 125) {
        strings.push(buffer)
        buffer = ""

        substitutions.push(keys[0])
        filters.push(
          filterKeys.length > 0
            ? filterKeys.map((filter) => parseFunctionCall(filter, jsonParser))
            : undefined
        )

        current = i
        continue
      }
    }

    buffer += char
    current++
  }

  strings.push(buffer)

  return { strings, substitutions, filters }
}
