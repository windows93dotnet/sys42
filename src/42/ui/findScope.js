import occurrences from "../fabric/type/string/occurrences.js"
import resolveScope from "./resolveScope.js"
import getDirname from "../core/path/core/getDirname.js"
import segmentize from "../fabric/type/string/segmentize.js"

export default function findScope(stage, loc) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  // TODO: debug "===" loc in ../../tests/42/ui/components/layout.test.js

  let { scope } = stage

  if (!stage.actions.has(loc)) {
    const baseLoc = getDirname(resolveScope(scope, loc, stage))
    if (baseLoc === stage.scope) {
      if (stage.computeds[stage.scope]) return [scope, loc]
    } else if (stage.reactive.has("$computed" + baseLoc)) {
      return [scope, loc]
    }
  }

  if (stage.scopeChain.length > 0) {
    if (loc.startsWith("/")) {
      return [stage.scopeChain.at(0).scope, loc]
    }

    if (loc.startsWith("../")) {
      const n = occurrences(loc, "../")
      const previous = stage.scopeChain.at(-n)
      const newLoc = loc.slice(n * 3)
      if (
        previous &&
        (previous.props === undefined || previous.props.includes(newLoc))
      ) {
        return [previous.scope, newLoc]
      }

      return [stage.scopeChain.at(0).scope, loc]
    }

    let i = stage.scopeChain.length
    const prop = segmentize(loc, [".", "/"])[0]

    if (stage.scopeChain.at(-1).props !== undefined) {
      while (i--) {
        const item = stage.scopeChain[i]
        if (item.props?.includes(prop)) return [scope, loc]
        scope = item.scope
      }
    }
  }

  // console.group("findScope", stage.scope)
  // console.log({ scope, loc })
  // // console.log(stage.reactive.data)
  // console.groupEnd()

  return [scope, loc]
}
