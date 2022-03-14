/* eslint-disable eqeqeq */

// @thanks https://github.com/Microsoft/vscode/blob/master/src/vs/platform/contextkey/common/contextkey.ts

import parseLiteral from "../../type/regex/parseLiteral.js"

export const operators = {
  "===": (a, b) => a === b,
  "!==": (a, b) => a !== b,
  "==": (a, b) => a == b,
  "!=": (a, b) => a != b,
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
  "=~": (a, b) => b.test(a),
}

const operatorsEntries = Object.entries(operators)

const primitives = {
  true: true,
  false: false,
  null: null,
  undefined,
}

const parseValue = (value) => {
  if (value in primitives) return primitives[value]
  const n = Number(value)
  if (Number.isNaN(n) === false) return n
  return value
}

// TODO: write real parser
export default function parseExpr(expr) {
  return expr.split("&&").map((expr) => {
    let key
    let value
    let comparator
    operatorsEntries.some(([op, fn]) => {
      if (expr.includes(op)) {
        comparator = fn
        const tokens = expr.split(op)
        key = tokens[0].trim()
        value =
          op === "=~"
            ? new RegExp(...parseLiteral(tokens[1].trim()))
            : parseValue(tokens[1].trim())

        return true
      }

      return false
    })
    if (!comparator) {
      key = expr.trim()
      if (key.startsWith("!")) {
        key = key.slice(1).trim()
        return { key, comparator: (x) => !x }
      }

      return { key, comparator: (x) => x }
    }

    return { key, comparator, value }
  })
}
