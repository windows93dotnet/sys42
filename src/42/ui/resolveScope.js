import resolvePath from "../fabric/type/path/core/resolvePath.js"
import parseDotNotation from "../fabric/locator/parseDotNotation.js"
import basename from "../fabric/type/path/extract/basename.js"
import locate from "../fabric/locator/locate.js"
import exists from "../fabric/locator/exists.js"

const sep = "/"

function checkProps(ctx, path) {
  path = path.split("/")[0] // TODO: optimise this
  const prop = locate(ctx.el.def.props, path, sep)
  if (prop && prop.state !== true) return ctx.scope
  if (ctx.computed && exists(ctx.computed, path, sep)) return ctx.scope
}

export default function resolveScope(scope, path, ctx) {
  if (path == null) throw new Error("Undefined path")
  path = String(path)

  if (typeof scope === "string") {
    if (ctx?.el.def) scope = checkProps(ctx, path) ?? scope
  } else {
    ctx ??= scope
    scope = ctx.scope

    if (ctx.stateScope) {
      if (path.startsWith("./") || path.startsWith("../")) {
        scope = ctx.stateScope
      } else if (ctx.el.def) {
        scope = checkProps(ctx, path) ?? ctx.stateScope
      }
    }
  }

  if (path.startsWith("@") || path.startsWith("#")) {
    path = `../${path}:${basename(scope)}`
  }

  const out = parseDotNotation(resolvePath(scope, path)).join("/")
  if (ctx === undefined) return out
  return locate(ctx.state.value, `${out}/$ref`, sep) ?? out
}
