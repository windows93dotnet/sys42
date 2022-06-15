import resolvePath from "../fabric/type/path/core/resolvePath.js"

export default function resolve(ctx, path) {
  path = String(path)
  if (typeof ctx === "string") {
    return resolvePath(ctx, path).replaceAll(".", "/")
  }

  const scope =
    ctx.stateScope && (path.startsWith("./") || path.startsWith("../"))
      ? ctx.stateScope
      : ctx.scope

  return resolvePath(scope, path).replaceAll(".", "/")
}
