import occurrences from "../fabric/type/string/occurrences.js"
import resolveScope from "./resolveScope.js"
import getDirname from "../core/path/core/getDirname.js"
import segmentize from "../fabric/type/string/segmentize.js"

export default function findScope(ctx, loc) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  let { scope } = ctx

  if (!ctx.actions.has(loc)) {
    const baseLoc = getDirname(resolveScope(scope, loc, ctx))
    if (baseLoc === ctx.scope) {
      if (ctx.computeds[ctx.scope]) return [scope, loc]
    } else if (ctx.reactive.has("$computed" + baseLoc)) {
      return [scope, loc]
    }
  }

  if (ctx.scopeChain.length > 0) {
    if (loc.startsWith("/")) {
      return [ctx.scopeChain.at(0).scope, loc]
    }

    if (loc.startsWith("../")) {
      const n = occurrences(loc, "../")
      const previous = ctx.scopeChain.at(-n)
      const newLoc = loc.slice(n * 3)
      // console.log(loc, previous, n, ctx.scope)
      if (
        previous &&
        (previous.props === undefined || previous.props.includes(newLoc))
      ) {
        return [previous.scope, newLoc]
      }

      return [ctx.scopeChain.at(0).scope, loc]
    }

    let i = ctx.scopeChain.length
    const prop = segmentize(loc, [".", "/"])[0]

    if (ctx.scopeChain.at(-1).props !== undefined) {
      while (i--) {
        const item = ctx.scopeChain[i]
        if (item.props?.includes(prop)) return [scope, loc]
        scope = item.scope
      }
    }
  }

  // console.group("findScope", ctx.scope)
  // console.log({ scope, loc })
  // // console.log(ctx.reactive.data)
  // console.groupEnd()

  return [scope, loc]
}
