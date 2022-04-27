import isLength from "../../../fabric/type/any/is/isLength.js"
import operators from "./operators.js"

const PIPE = Symbol("pipe")

function compileToken(i, list, tokens, options) {
  const { type, value, negated } = tokens[i]
  const { locate, filters, locals: compileLocals } = options

  if (type === "function") {
    let argTokens = []

    const start = i + 1
    let end = start

    for (let j = start, l = tokens.length; j < l; j++) {
      if (tokens[j].type === "functionEnd") {
        end = j
        break
      }
    }

    if (end > start) {
      const subset = tokens.slice(start, end)
      argTokens = compileExpression(subset, options)
      i = end
    }

    const fn = locate(filters, value)

    if (fn) {
      if (!options.async && typeof fn !== "function") {
        throw new TypeError(`Template filter is not a function: "${value}"`)
      }

      list.push(
        options.async
          ? async (locals, args = []) => {
              args.unshift(fn)
              const undones = args
              for (const arg of argTokens) undones.push(arg(locals))
              const [asyncFn, ...rest] = await Promise.all(undones)
              if (typeof asyncFn !== "function") {
                throw new TypeError(
                  `Template filter didn't resolve as a function: "${value}"`
                )
              }

              return asyncFn.call(options.thisArg, ...rest)
            }
          : (locals, args = []) => {
              for (const arg of argTokens) args.push(arg(locals))
              return fn.call(options.thisArg, ...args)
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
        ? (locals) => !locate(locals, value)
        : (locals) => locate(locals, value)
    )
  } else if (type === "arg") {
    if (!negated && isLength(value)) {
      if (compileLocals) {
        list.push(
          Array.isArray(compileLocals) ? (locals) => locals[value] : () => value
        )
      } else {
        list.push((locals) => (Array.isArray(locals) ? locals[value] : value))
      }
    } else list.push(negated ? () => !value : () => value)
  }

  return i
}

export default function compileExpression(tokens, options = {}) {
  const list = []

  // reduce function, key and arg tokens
  for (let i = 0, l = tokens.length; i < l; i++) {
    i = compileToken(i, list, tokens, options)
  }

  // reduce operation tokens
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

  // reduce ternary tokens
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

  // reduce pipe tokens
  for (let i = 0, l = list.length; i < l; i++) {
    if (list[i] === PIPE) {
      const fn = (locals) => filter(locals, [res(locals)])
      const [res, , filter] = list.splice(i - 1, 3, fn)
      i -= l - list.length
    }
  }

  return list
}
