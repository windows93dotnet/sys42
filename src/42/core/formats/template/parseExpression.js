/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable no-useless-concat */

import parseRegexLiteral from "../../../fabric/type/regex/parseRegexLiteral.js"
import { operators, assignments } from "./operators.js"

const operatorsKeys = Object.keys(operators)
const assignmentsKeys = Object.keys(assignments)

const pairs = {
  '"': '"',
  "'": "'",
  "[": "]",
  "{": "}",
}

const regexFlags = new Set(["d", "g", "i", "m", "s", "u", "y"])

const pairsKeys = new Set(Object.keys(pairs))

export default function parseExpression(source, jsonParse = JSON.parse) {
  if (source.startsWith("{" + "{") && source.endsWith("}" + "}")) {
    source = source.slice(2, -2)
  }

  let buffer = ""
  let current = 0

  let state = "arg"
  const tokens = []

  function eat(char) {
    buffer += char
    current++
  }

  function flush() {
    buffer = buffer.trim()
    if (buffer || state === "condition") {
      let negated
      if (state === "regex") {
        buffer = new RegExp(...parseRegexLiteral(buffer))
        state = "arg"
      } else if (state === "arg" || state === "key") {
        negated = buffer.startsWith("!")
        if (negated) buffer = buffer.slice(1)
        if (
          buffer.startsWith("/") ||
          buffer.startsWith("./") ||
          buffer.startsWith("../")
        ) {
          state = "key"
        } else {
          try {
            buffer = jsonParse(buffer)
            state = "arg"
          } catch {
            state = "key"
          }
        }

        if (state === "key" && tokens.at(-1)?.type === "pipe") {
          tokens.push(
            { type: "function", value: buffer },
            { type: "functionEnd" }
          )
          state = "arg"
          buffer = ""
          return
        }
      }

      const token = { type: state, value: buffer }
      if (negated) token.negated = true
      tokens.push(token)
      state = "arg"
      buffer = ""
    }
  }

  let lastCharEscaped = false
  let regexOpen = false

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

    if (state === "regex") {
      if (regexOpen && char === "/") {
        eat(char)
        let i = 0
        const l = regexFlags.size
        for (; i < l; i++) {
          const flag = source[current + i]
          if (regexFlags.has(flag)) eat(flag)
        }

        flush()
        state = "arg"
        current += i
        continue
      } else if (char === "/") {
        regexOpen = true
      }

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

    if (char === "|" && source[current + 1] === ">") {
      flush()
      tokens.push({ type: "pipe" })
      current += 2
      continue
    }

    if (char === "," || char === ";") {
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

    // TODO: test parsing "??="
    if (char === "?" && source[current + 1] !== "?") {
      flush()
      tokens.push({ type: "ternary", value: true })
      state = "arg"
      current++
      continue
    }

    if (char === "+") {
      const next = source[current + 1]
      if (next === "+") {
        flush()
        tokens.push(
          { type: "assignment", value: "+=" },
          { type: "arg", value: 1 }
        )
        state = "arg"
        current += 2
        continue
      }
    }

    if (char === "-") {
      const next = source[current + 1]
      if (next === "-") {
        flush()
        tokens.push(
          { type: "assignment", value: "-=" },
          { type: "arg", value: 1 }
        )
        state = "arg"
        current += 2
        continue
      }
    }

    for (const value of assignmentsKeys) {
      if (value === "=") {
        const next = source[current + 1]
        if (next === "=" || next === "~") continue
      }

      if (source.startsWith(value, current)) {
        flush()
        tokens.push({ type: "assignment", value })
        state = "arg"
        current += value.length
        continue main
      }
    }

    for (const value of operatorsKeys) {
      if (source.startsWith(value, current)) {
        if (value === "/" && source[current + 1] !== " ") continue
        flush()
        tokens.push({ type: "operator", value })
        state = value === "=~" ? "regex" : "arg"
        current += value.length
        continue main
      }
    }

    eat(char)
  }

  flush()

  return tokens
}
