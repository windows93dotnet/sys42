import joinScope from "./joinScope.js"

export default function resolveScope(ctx, loc) {
  const current = ctx.global.state.getThisArg(ctx.scope)
  const p = current?.["@findPath"]?.(loc) ?? ctx.scope
  return joinScope(p, loc)
}
