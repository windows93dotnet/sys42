import resolvePath from "../fabric/type/path/core/resolvePath.js"
import basename from "../fabric/type/path/extract/basename.js"

export default function resolveScope(scope, path, ctx) {
  path = String(path)

  if (typeof scope !== "string") {
    ctx ??= scope

    // TODO: rewrite as readable version
    scope = ctx.stateScope
      ? path.startsWith("./") || path.startsWith("../")
        ? ctx.scope
        : ctx.el.def
        ? path in ctx.el.def.props && ctx.el.def.props[path].state !== true
          ? ctx.scope
          : ctx.stateScope
        : ctx.stateScope
        ? ctx.scope
        : ctx.stateScope
      : ctx.scope
  }

  if (path.startsWith("@") || path.startsWith("#")) {
    path = `../${path}:${basename(scope)}`
  }

  const out = resolvePath(scope, path)

  const pre = ctx.state.get(out, { silent: true })
  if (pre && typeof pre === "object" && "$ref" in pre) {
    // console.log(1, pre)
    return pre.$ref
  }

  return out
}
