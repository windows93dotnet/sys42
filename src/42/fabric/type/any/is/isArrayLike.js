import isLength from "./isLength.js"

export default function isArrayLike(x) {
  return x != null && typeof x !== "function" && isLength(x.length)
}
