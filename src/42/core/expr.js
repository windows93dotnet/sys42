// TODO: arbitrary precision decimal floating point arithmetic https://github.com/davidmartinez10/bigfloat-esnext

import locate from "../fabric/locator/locate.js"
import JSON5 from "./formats/json5.js"
import parseExpression from "./formats/template/parseExpression.js"
import compileExpression from "./formats/template/compileExpression.js"

export default function expr(locals, str, options) {
  return expr.compile(expr.parse(str), options)(locals)
}

expr.parse = (source) => parseExpression(source, JSON5.parse)

expr.compile = (parsed, options) =>
  compileExpression(parsed, { locate, ...options })

expr.evaluate = (str, options) => expr.compile(expr.parse(str), options)
