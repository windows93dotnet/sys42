/* eslint-disable complexity */
import { operators, assignments } from "./operators.js"
import allocate from "../../../fabric/locator/allocate.js"

const PIPE = Symbol("pipe")

function compileToken(i, list, tokens, options) {
  const { type, value, negated, loc } = tokens[i]
  const { locate, filters, sep } = options

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

    const fn = locate(filters, value, sep)

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
  else if (type === "assignment") list.push(value)
  else if (type === "key") {
    list.push(
      negated
        ? (locals) => !locate(locals, value, sep)
        : (locals) => locate(locals, value, sep)
    )
  } else if (type === "arg") {
    if (!negated && Number.isInteger(value)) {
      if (loc) {
        const baseLoc = loc.replace(new RegExp(`${sep}${value}$`), "")
        list.push((locals) => {
          const base = locate(locals, baseLoc, sep)
          return Array.isArray(base) ? base.at(value) : value
        })
      } else {
        list.push((locals) =>
          Array.isArray(locals) ? locate(locals, value, sep) : value
        )
      }
    } else list.push(negated ? () => !value : () => value)
  }

  if (tokens[i + 1]?.type === "assignment") {
    list.at(-1).path = value
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
      if (list[i] in operators) {
        const operate = operators[list[i]]
        const fn = options.async
          ? async (locals) => operate(await left(locals), await right(locals))
          : (locals) => operate(left(locals), right(locals))
        const [left, , right] = list.splice(i - 1, 3, fn)
        i -= l - list.length
      } else if (list[i] in assignments) {
        if (!options.assignment) throw new Error("Assignment not allowed")
        const assign = assignments[list[i]]
        const fn = options.async
          ? async (locals) => {
              const res = await assign(await left(locals), await right(locals))
              allocate(locals, left.path, res, options.sep)
              return res
            }
          : (locals) => {
              const res = assign(left(locals), right(locals))
              allocate(locals, left.path, res, options.sep)
              return res
            }

        const [left, , right] = list.splice(i - 1, 3, fn)
        i -= l - list.length
      }
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
