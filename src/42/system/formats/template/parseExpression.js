const operators = ["===", "!==", "==", "!=", ">=", "<=", ">", "<", "=~"]

const operatorsFirstletter = new Set(operators.map((x) => x[0]))

export function parseCondition(source, jsonParse = JSON.parse) {
  let buffer = ""
  let current = 0
  const tokens = []

  function eat(char) {
    buffer += char
    current++
  }

  function flush() {
    let value = buffer.trim()
    if (value) {
      let type = "key"
      let negated = false

      if (value.startsWith("!")) {
        negated = true
        value = value.slice(1)
      }

      try {
        value = jsonParse(value)
        type = "arg"
      } catch {
        type = "key"
      }

      if (negated) {
        tokens.push({ type, value, negated: true })
      } else {
        tokens.push({ type, value })
      }

      buffer = ""
    }
  }

  main: while (current < source.length) {
    const char = source[current]

    if (operatorsFirstletter.has(char)) {
      for (const operator of operators) {
        if (source.startsWith(operator, current)) {
          flush()
          tokens.push({ type: "operator", value: operator })
          current += operator.length
          continue main
        }
      }
    }

    if (source.startsWith("&&", current)) {
      flush()
      tokens.push({ type: "and" })
      current += 2
      continue
    }

    if (source.startsWith("||", current)) {
      flush()
      tokens.push({ type: "or" })
      current += 2
      continue
    }

    eat(char)
  }

  flush()

  return tokens
}

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

  let currentFunction

  function eat(char) {
    buffer += char
    current++
  }

  function flush() {
    buffer = buffer.trim()
    if (buffer || state === "condition") {
      if (state === "arg" || state === "key") {
        try {
          buffer = jsonParse(buffer)
          state = "arg"
        } catch {
          state = "key"
        }

        if (state === "key") {
          if (tokens.at(-1)?.type === "pipe") {
            tokens.push(
              { type: "function", value: buffer },
              { type: "functionEnd" }
            )
            buffer = ""
            return
          }

          const expr = parseCondition(buffer)
          if (expr[0]?.value !== buffer) {
            tokens.push(
              { type: "condition" }, //
              ...expr,
              { type: "conditionEnd" }
            )
            buffer = ""
            return
          }
        }
      }

      tokens.push({ type: state, value: buffer })
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
      currentFunction = tokens.length
      flush()
      state = "arg"
      current++
      continue
    }

    if (char === "|") {
      if (source[current + 1] === "|") {
        buffer += "||"
        current += 2
        continue
      }

      flush()
      tokens.push({ type: "pipe" })
      currentFunction = undefined
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
      state = "arg"
      current++
      continue
    }

    if (char === "?") {
      if (source[current + 1] === "?") {
        buffer += "??"
        current += 2
        continue
      }

      if (currentFunction === undefined) {
        tokens.push({ type: "ternary" })
        flush()
      } else {
        flush()
        tokens.splice(currentFunction, 0, { type: "ternary" })
        currentFunction = undefined
      }

      // state = "key"
      current++
      continue
    }

    eat(char)
  }

  flush()

  return tokens
}
