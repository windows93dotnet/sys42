const { MAX_SAFE_INTEGER } = Number

export default function isLength(x) {
  return typeof x === "number" && x > -1 && x % 1 === 0 && x <= MAX_SAFE_INTEGER
}
