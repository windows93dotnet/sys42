const { MAX_SAFE_INTEGER } = Number

export default function isLength(x) {
  return typeof x === "number" && x >>> 0 === x && x <= MAX_SAFE_INTEGER
}
