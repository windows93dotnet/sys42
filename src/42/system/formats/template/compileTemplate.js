import compileExpression from "./compileExpression.js"

export default function compileTemplate(parsed, options = {}) {
  const { strings } = parsed
  const substitutions = []

  for (const tokens of parsed.substitutions) {
    const list = compileExpression(tokens, options)

    if (list.length > 1) {
      throw Object.assign(
        new Error("template syntax error, didn't reduced to one function"),
        { parsed, list }
      )
    }

    substitutions.push(list[0])
  }

  return options.async
    ? async (locals) => {
        const out = [strings[0]]

        for (let i = 0, l = substitutions.length; i < l; i++) {
          const res = substitutions[i](locals)
          out.push(res, strings[i + 1])
        }

        return (await Promise.all(out)).join("")
      }
    : (locals) => {
        let out = strings[0]

        for (let i = 0, l = substitutions.length; i < l; i++) {
          out += substitutions[i](locals)
          out += strings[i + 1]
        }

        return out
      }
}
