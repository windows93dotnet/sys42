// TODO: arbitrary precision decimal floating point arithmetic https://github.com/davidmartinez10/bigfloat-esnext

import parseExpr from "./expr/parseExpr.js"
import compileExpr from "./expr/compileExpr.js"

export default function expr(target, str) {
  return compileExpr(parseExpr(str))(target)
}

expr.parse = parseExpr
expr.compile = (parsed) => compileExpr(parsed)
expr.evaluate = (str) => compileExpr(parseExpr(str))
