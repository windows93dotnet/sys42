import operators from "./operators.js"

const operatorsKeys = Object.keys(operators)

const pairs = {
  '"': '"',
  "'": "'",
  "[": "]",
  "{": "}",
}

const pairsKeys = new Set(Object.keys(pairs))

export default function parseExpression(source, jsonParse = JSON.parse) {
  let buffer = ""
  let current = 0

  let state = "key"
  const tokens = []

  function eat(char) {
    buffer += char
    current++
  }

  function flush() {
    buffer = buffer.trim()
    if (buffer || state === "condition") {
      let negated
      if (state === "arg" || state === "key") {
        negated = buffer.startsWith("!")
        if (negated) buffer = buffer.slice(1)
        try {
          buffer = jsonParse(buffer)
          state = "arg"
        } catch {
          state = "key"
        }

        if (state === "key" && tokens.at(-1)?.type === "pipe") {
          tokens.push(
            { type: "function", value: buffer },
            { type: "functionEnd" }
          )
          buffer = ""
          return
        }
      }

      const token = { type: state, value: buffer }
      if (negated) token.negated = true
      tokens.push(token)
      buffer = ""
    }
  }

  let lastCharEscaped = false

  main: while (current < source.length) {
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
        state = "arg"
        current++
        tokens.push({ type: "functionEnd" })
        continue
      }
    }

    if (pairsKeys.has(state)) {
      if (char === pairs[state]) {
        state = "arg"
        buffer += char
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

    if (char === "(") {
      state = "function"
      flush()
      state = "arg"
      current++
      continue
    }

    if (char === "|" && source[current + 1] !== "|") {
      flush()
      tokens.push({ type: "pipe" })
      current++
      continue
    }

    if (char === ",") {
      flush()
      state = "arg"
      current++
      continue
    }

    if (char === ":") {
      flush()
      tokens.push({ type: "ternary", value: false })
      state = "arg"
      current++
      continue
    }

    if (char === "?" && source[current + 1] !== "?") {
      flush()
      tokens.push({ type: "ternary", value: true })
      state = "arg"
      current++
      continue
    }

    for (const operator of operatorsKeys) {
      if (source.startsWith(operator, current)) {
        flush()
        tokens.push({ type: "operator", value: operator })
        state = "arg"
        current += operator.length
        continue main
      }
    }

    eat(char)
  }

  flush()

  return tokens
}
