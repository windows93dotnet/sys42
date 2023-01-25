import isHashmapLike from "./is/isHashmapLike.js"
import merge from "../object/merge.js"

export function unproxy(val) {
  if (isHashmapLike(val)) return merge({}, val)
  if (Array.isArray(val)) return merge([], val)
  return val
}

export default unproxy
