export default function parsePattern(reg) {
  const source = reg.source ?? reg

  const type = typeof source
  if (type !== "string") {
    throw new TypeError(`First argument must be a regexp or a string: ${type}`)
  }

  let current = 0

  function walk() {
    let char = source[current]

    if (char === "(") {
      char = source[++current]
      const items = []
      let construct = ""
      let quantifier = ""

      if (source[current] === "?") {
        construct = char + source[++current]
        char = source[++current]
      }

      while (char !== ")") {
        items.push(walk())
        char = source[current]
      }

      current++

      const match = source
        .slice(Math.max(0, current))
        .match(/^({\d+,?\d*}|[*+?]+)/)

      if (match) {
        quantifier = match[0]
        current += quantifier.length
      }

      return { type: "Group", items, construct, quantifier }
    }

    if (char === "|") {
      current++
      return { type: "Pipe", value: "|" }
    }

    let value = ""
    while (char && char !== "(" && char !== ")" && char !== "|") {
      value += char
      char = source[++current]
    }

    return { type: "Text", value }
  }

  const tokens = []
  while (current < source.length) tokens.push(walk())

  return tokens
}
