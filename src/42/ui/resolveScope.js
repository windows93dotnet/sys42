import resolvePath from "../core/path/core/resolvePath.js"
import segmentize from "../fabric/type/string/segmentize.js"
import getBasename from "../core/path/core/getBasename.js"
import same from "../fabric/type/array/same.js"

export default function resolveScope(scope, loc, stage) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  if (loc.startsWith("@")) {
    loc = loc.startsWith("@component")
      ? stage.component.stage.scope + loc.slice(10)
      : loc.startsWith("@scope")
      ? stage.scope + loc.slice(6)
      : `../${loc}:${getBasename(scope)}`
  } else if (loc.startsWith("#")) {
    if (!same(loc, "#")) {
      throw new Error(
        "Invalid # character usage (expression must only include #)"
      )
    }

    loc = `../${loc}:${getBasename(scope)}`
  }

  const out = segmentize(resolvePath(scope, loc)).join("/")
  if (stage === undefined) return out
  return out in stage.refs ? stage.refs[out] : out
}
