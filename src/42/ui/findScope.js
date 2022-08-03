import occurences from "../fabric/type/string/occurences.js"

export default function findScope(ctx, loc) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  let { scope } = ctx

  if (ctx.computeds.has(scope)) return [scope, loc]

  if (ctx.scopeChain.length > 0) {
    if (loc.startsWith("/")) {
      return [ctx.scopeChain.at(0).scope, loc]
    }

    if (loc.startsWith("../")) {
      const n = occurences(loc, "../")
      const previous = ctx.scopeChain.at(-n)
      const newLoc = loc.slice(n * 3)
      if (previous && previous.props.includes(newLoc)) {
        return [previous.scope, newLoc]
      }

      return [ctx.scopeChain.at(0).scope, loc]
    }

    let i = ctx.scopeChain.length
    while (i--) {
      const item = ctx.scopeChain[i]
      if (item.props.includes(loc)) break
      scope = item.scope
    }
  }

  return [scope, loc]
}
