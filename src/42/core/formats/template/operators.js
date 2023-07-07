/* eslint-disable eqeqeq */

export const comparators = {
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

export const assignableOperators = {
  ">>>": (a, b) => a >>> b,
  ">>": (a, b) => a >> b,
  "<<": (a, b) => a << b,
  "**": (a, b) => a ** b,
  "&&": (a, b) => a && b,
  "||": (a, b) => a || b,
  "??": (a, b) => a ?? b,
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
  "%": (a, b) => a % b,
  "&": (a, b) => a & b,
  "^": (a, b) => a ^ b,
  "|": (a, b) => a | b,
}

export const operators = {
  ...assignableOperators,
  ...comparators,
  // instanceof: (a, b) => a instanceof b,
  // in: (a, b) => a in b,
  // delete: (a, b) => delete a[b],
}

export const assignments = {
  "=": (a, b) => b,
  ...Object.fromEntries(
    Object.entries(assignableOperators).map(([key, val]) => [key + "=", val]),
  ),
}

export default { comparators, operators, assignableOperators, assignments }
