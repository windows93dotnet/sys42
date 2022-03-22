const pairs = {
  '"': '"',
  "'": "'",
  "[": "]",
  "{": "}",
}

const pairsKeys = new Set(Object.keys(pairs))

export default function parseTemplateSyntax(source, jsonParse = JSON.parse) {
  let buffer = ""
  let current = 0

  let state = "key"
  const tokens = []

  let currentFunction

  function eat(char) {
    buffer += char
    current++
  }

  function flush() {
    buffer = buffer.trim()
    if (buffer || state === "condition") {
      if (state === "arg") {
        try {
          buffer = jsonParse(buffer)
        } catch {
          state = "key"
        }
      }

      tokens.push({ type: state, buffer, pos: current })
      buffer = ""
    }
  }

  let lastCharEscaped = false

  while (current < source.length) {
    const char = source[current]

    if (char === "\\") {
      lastCharEscaped = true
      eat(char)
      continue
    }

    if (lastCharEscaped) {
      lastCharEscaped = false
      eat(char)
      continue
    }

    if (state === "arg") {
      if (char === ",") {
        flush()
        current++
        continue
      }

      if (char === ")") {
        flush()
        state = "key"
        current++
        tokens.push({ type: "functionEnd" })
        continue
      }
    } else if (char === "(") {
      state = "function"
      currentFunction = tokens.length
      flush()
      state = "arg"
      current++
      continue
    }

    if (pairsKeys.has(state)) {
      if (char === pairs[state]) {
        state = "arg"
        buffer += char
        flush()
        current++
        continue
      }

      eat(char)
      continue
    } else if (pairsKeys.has(char)) {
      state = char
      eat(char)
      continue
    }

    if (char === "|") {
      flush()
      tokens.push({ type: "pipe" })
      currentFunction = undefined
      current++
      continue
    }

    if (state === "key" && char === ",") {
      flush()
      state = "arg"
      current++
      continue
    }

    if (char === ":") {
      flush()
      state = "key"
      current++
      continue
    }

    if (char === "?") {
      if (currentFunction === undefined) {
        tokens.push({ type: "ternary" })
        flush()
      } else {
        flush()
        tokens.splice(currentFunction, 0, { type: "ternary" })
        currentFunction = undefined
      }

      state = "key"
      current++
      continue
    }

    eat(char)
  }

  flush()

  return tokens
}
