// TODO: arbitrary precision decimal floating point arithmetic https://github.com/davidmartinez10/bigfloat-esnext

import JSON5 from "./formats/json5.js"
import parseExpression from "./formats/template/parseExpression.js"
import compileExpression from "./formats/template/compileExpression.js"

const parseValue = JSON5.parse

export default function expr(str, locals, options) {
  return compileExpression(parseExpression(str, parseValue), options)(locals)
}

expr.parse = (str) => parseExpression(str, parseValue)

expr.compile = compileExpression

expr.evaluate = (str, options) =>
  compileExpression(parseExpression(str, parseValue), options)
