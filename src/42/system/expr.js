// TODO: arbitrary precision decimal floating point arithmetic https://github.com/davidmartinez10/bigfloat-esnext

import locate from "../fabric/locator/locate.js"
import JSON5 from "./formats/json5.js"
import parseExpression from "./formats/template/parseExpression.js"
import compileExpression from "./formats/template/compileExpression.js"

const jsonParse = JSON5.parse

export default function expr(target, str, options) {
  return expr.compile(expr.parse(str), options)(target)
}

expr.parse = (source) => parseExpression(source, jsonParse)

expr.compile = (parsed, options) => {
  const compiled = compileExpression(parsed, {
    locate,
    jsonParse,
    sep: options?.sep,
  })[0]

  return options?.boolean
    ? (target) => Boolean(compiled(target))
    : (target) => compiled(target)
}

expr.evaluate = (str, options) => expr.compile(expr.parse(str), options)
