import parseFunctionCall from "./parseFunctionCall.js"

function addKey(list, filterKeys, key) {
  key = key.trim()
  if (key.endsWith(")")) filterKeys.push(key)
  else list.push(key.trim())
}

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

      let lastCharEscaped = false

      do {
        key += source[i]
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

        if (n === 124 /* | */) {
          addKey(list, filterKeys, key)
          list = filterKeys
          key = ""
          i++
        }
      } while (
        (n !== 125 /* } */ || source.charCodeAt(i + 1) !== 125) &&
        i + 1 < source.length
      )

      addKey(list, filterKeys, key)

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
