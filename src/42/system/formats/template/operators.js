/* eslint-disable eqeqeq */

export default {
  "&&": (a, b) => a && b,
  "||": (a, b) => a || b,
  "??": (a, b) => a ?? b,
  "===": (a, b) => a === b,
  "!==": (a, b) => a !== b,
  "==": (a, b) => a == b,
  "!=": (a, b) => a != b,
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
  "=~": (a, b) => Boolean(a.match(b)),
}
