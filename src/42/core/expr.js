// TODO: arbitrary precision decimal floating point arithmetic https://github.com/davidmartinez10/bigfloat-esnext

import locate from "../fabric/locator/locate.js"
import JSON5 from "./formats/json5.js"
import parseExpression from "./formats/template/parseExpression.js"
import compileExpression from "./formats/template/compileExpression.js"

const jsonParse = JSON5.parse

export default function expr(locals, str, options) {
  return expr.compile(expr.parse(str), options)(locals)
}

expr.parse = (source) => parseExpression(source, jsonParse)

expr.compile = (parsed, options) => {
  const list = compileExpression(parsed, {
    locate,
    jsonParse,
    ...options,
  })

  if (options?.assignment) {
    return options?.boolean
      ? options?.async
        ? async (...locals) =>
            Boolean((await Promise.all(list.map((fn) => fn(locals)))).at(-1))
        : (...locals) => Boolean(list.map((fn) => fn(locals)).at(-1))
      : (...locals) => list.map((fn) => fn(locals)).at(-1)
  }

  const fn = list.at(-1)

  return options?.boolean
    ? options?.async
      ? async (...locals) => Boolean(await fn(locals))
      : (...locals) => Boolean(fn(locals))
    : (...locals) => fn(locals)
}

expr.evaluate = (str, options) => expr.compile(expr.parse(str), options)
