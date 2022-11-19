import resolvePath from "../core/path/core/resolvePath.js"
import separate from "../fabric/type/string/separate.js"
import getBasename from "../core/path/core/getBasename.js"

export default function resolveScope(scope, loc, ctx) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  if (loc.startsWith("@") || loc.startsWith("#")) {
    loc = `../${loc}:${getBasename(scope)}`
  }

  const out = separate(resolvePath(scope, loc)).join("/")
  if (ctx === undefined) return out
  return out in ctx.refs ? ctx.refs[out] : out
}
