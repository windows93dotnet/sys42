import isHashmapLike from "./is/isHashmapLike.js"
import merge from "../object/merge.js"

function _simplify(obj) {
  return obj[Symbol.for("serialize")]?.() ?? obj.toJSON?.() ?? {}
}

export function serialize(val, simplify = _simplify) {
  if (val && typeof val === "object") {
    if (isHashmapLike(val)) return merge({}, val, { simplify })
    if (Array.isArray(val)) return merge([], val, { simplify })
    return simplify(val)
  }

  return val
}

export default serialize
