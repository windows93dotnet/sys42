import compileExpression from "./compileExpression.js"

export default function compileTemplate(parsed, options = {}) {
  const { strings } = parsed
  const substitutions = []

  const config = { ...options, returnList: true }

  for (const tokens of parsed.substitutions) {
    const list = compileExpression(tokens, config)

    if (list.length > 1 || list[0].length > 1) {
      throw Object.assign(
        new Error("template syntax error, didn't reduced to one function"),
        { parsed, list }
      )
    }

    substitutions.push(list[0][0])
  }

  return options.async
    ? async (...locals) => {
        if (options.locals) locals = [...locals, options.locals]
        let out = strings[0] ? [strings[0]] : []

        for (let i = 0, l = substitutions.length; i < l; i++) {
          const res = substitutions[i](locals)
          if (res !== undefined) out.push(res)
          if (strings[i + 1]) out.push(strings[i + 1])
        }

        out = await Promise.all(out)
        return out.length === 1 ? out[0] : out.join("")
      }
    : (...locals) => {
        if (options.locals) locals = [...locals, options.locals]
        let out = strings[0]

        for (let i = 0, l = substitutions.length; i < l; i++) {
          out += substitutions[i](locals) ?? ""
          out += strings[i + 1]
        }

        return out
      }
}
