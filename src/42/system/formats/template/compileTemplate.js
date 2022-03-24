import isLength from "../../../fabric/type/any/is/isLength.js"
import operators from "./operators.js"

let n = 0

const PIPE = Symbol("pipe")

function compileSub(i, list, substitution, options) {
  if (n++ > 200) throw new Error("Max recursion")

  const { type, value, negated } = substitution[i]
  const { locate, filters, locals: compileLocals } = options

  if (type === "function") {
    let args = []

    const start = i + 1
    let end = start

    for (let j = start, l = substitution.length; j < l; j++) {
      if (substitution[j].type === "functionEnd") {
        end = j
        break
      }
    }

    if (end > start) {
      const subset = substitution.slice(start, end)
      args = compileExpression(subset, options)
      i = end
    }

    const fn = locate(filters, value)
    if (fn) {
      list.push(
        options.async
          ? async (locals, compiledArgs = []) => {
              for (const arg of args) compiledArgs.push(arg(locals))
              return fn(...(await Promise.all(compiledArgs)))
            }
          : (locals, compiledArgs = []) => {
              for (const arg of args) compiledArgs.push(arg(locals))
              return fn(...compiledArgs)
            }
      )
    }

    return i
  }

  if (type === "pipe") list.push(PIPE)
  else if (type === "ternary") list.push(value)
  else if (type === "operator") list.push(value)
  else if (type === "key") {
    list.push(
      negated
        ? (locals) => !locate(locals, value) ?? ""
        : (locals) => locate(locals, value) ?? ""
    )
  } else if (type === "arg") {
    if (!negated && isLength(value)) {
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
    } else list.push(negated ? () => !value : () => value)
  }

  return i
}

function compileExpression(substitution, options) {
  const list = []

  for (let i = 0, l = substitution.length; i < l; i++) {
    i = compileSub(i, list, substitution, options)
  }

  for (let i = 0, l = list.length; i < l; i++) {
    if (typeof list[i] === "string") {
      const operate = operators[list[i]]
      const fn = options.async
        ? async (locals) => operate(await left(locals), await right(locals))
        : (locals) => operate(left(locals), right(locals))
      const [left, , right] = list.splice(i - 1, 3, fn)
      i -= l - list.length
    }
  }

  for (let i = 0, l = list.length; i < l; i++) {
    if (list[i] === true) {
      const fn = options.async
        ? async (locals) =>
            (await condition(locals)) ? ifTrue(locals) : ifFalse(locals)
        : (locals) => (condition(locals) ? ifTrue(locals) : ifFalse(locals))
      const [condition, , ifTrue, , ifFalse] = list.splice(i - 1, 5, fn)
      i -= l - list.length
    }
  }

  for (let i = 0, l = list.length; i < l; i++) {
    if (list[i] === PIPE) {
      const fn = (locals) => filter(locals, [res(locals)])
      const [res, , filter] = list.splice(i - 1, 3, fn)
      i -= l - list.length
    }
  }

  return list
}

export default function compileTemplate(parsed, options = {}) {
  n = 0
  const { strings } = parsed
  const substitutions = []

  for (const substitution of parsed.substitutions) {
    const list = compileExpression(substitution, options)

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
