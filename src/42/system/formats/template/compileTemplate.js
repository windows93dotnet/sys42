import isLength from "../../../fabric/type/any/is/isLength.js"

function compileSub(i, list, substitution, options) {
  const { type, value, locals: compileLocals } = substitution[i]
  const { locate, filters } = options

  if (type === "function") {
    const args = []

    const inPipe = substitution.at(i - 1)?.type === "pipe"

    i++
    while (substitution[i].type !== "functionEnd") {
      compileSub(i, args, substitution, options)
      i++
    }

    if (inPipe) {
      const previous = list.pop()
      args.unshift(previous)
    }

    const fn = locate(filters, value)
    if (fn) {
      list.push((locals) => {
        const compiledArgs = []
        for (const arg of args) compiledArgs.push(arg(locals))
        return fn(...compiledArgs)
      })
    }

    return i
  }

  if (type === "key") list.push((locals) => locate(locals, value) ?? "")

  if (type === "arg") {
    if (isLength(value)) {
      if (compileLocals) {
        list.push(
          Array.isArray(compileLocals)
            ? (locals) => locals[value] ?? ""
            : () => value
        )
      } else {
        list.push((locals) =>
          Array.isArray(locals) ? locals[value] ?? "" : value
        )
      }
    } else list.push(() => value)
  }

  return i
}

export default function compileTemplate(parsed, options = {}) {
  const { strings } = parsed
  const substitutions = []

  for (const substitution of parsed.substitutions) {
    const list = []

    const ternaries = []

    for (let i = 0, l = substitution.length; i < l; i++) {
      if (substitution[i].type === "ternary") ternaries.push(i)
      else i = compileSub(i, list, substitution, options)
    }

    for (const ternary of ternaries) {
      const condition = list.splice(ternary, 3, (locals) =>
        condition[0](locals) ? condition[1](locals) : condition[2](locals)
      )
    }

    substitutions.push(
      list.length === 1
        ? list[0]
        : (locals) => {
            let out = ""
            for (const exec of list) out += exec(locals)
            return out
          }
    )
  }

  return options.async
    ? async (locals) => {
        const out = [strings[0]]

        for (let i = 0, l = substitutions.length; i < l; i++) {
          const res = substitutions[i](locals)
          out.push(res, strings[i + 1] ?? "")
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
