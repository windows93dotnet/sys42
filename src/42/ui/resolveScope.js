import resolvePath from "../fabric/type/path/core/resolvePath.js"
import parseDotNotation from "../fabric/locator/parseDotNotation.js"
import getBasename from "../fabric/type/path/core/getBasename.js"
import locate from "../fabric/locator/locate.js"

const sep = "/"

export default function resolveScope(scope, loc, ctx) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  if (loc.startsWith("@") || loc.startsWith("#")) {
    loc = `../${loc}:${getBasename(scope)}`
  }

  const out = parseDotNotation(resolvePath(scope, loc)).join("/")
  if (ctx === undefined) return out
  return locate(ctx.reactive.data, `${out}/$ref`, sep) ?? out
}
