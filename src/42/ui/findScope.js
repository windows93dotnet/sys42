import occurences from "../fabric/type/string/occurences.js"
import resolveScope from "./resolveScope.js"
import dirname from "../fabric/type/path/extract/dirname.js"

export default function findScope(ctx, loc) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  let { scope } = ctx

  if (
    !ctx.actions.has(loc) &&
    ctx.computeds.has(dirname(resolveScope(scope, loc, ctx)))
  ) {
    return [scope, loc]
  }

  if (ctx.scopeChain.length > 0) {
    if (loc.startsWith("/")) {
      return [ctx.scopeChain.at(0).scope, loc]
    }

    if (loc.startsWith("../")) {
      const n = occurences(loc, "../")
      const previous = ctx.scopeChain.at(-n)
      const newLoc = loc.slice(n * 3)
      if (
        previous &&
        (previous.props === undefined || previous.props.includes(newLoc))
      ) {
        return [previous.scope, newLoc]
      }

      return [ctx.scopeChain.at(0).scope, loc]
    }

    let i = ctx.scopeChain.length
    if (ctx.scopeChain.at(-1).props !== undefined) {
      while (i--) {
        const item = ctx.scopeChain[i]
        if (item.props?.includes(loc)) return [scope, loc]
        scope = item.scope
      }
    }
  }

  // console.group("findScope", ctx.scope)
  // console.log({ scope, loc })
  // console.log(ctx.scopeChain)
  // console.groupEnd()

  return [scope, loc]
}
