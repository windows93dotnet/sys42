export default function isHashmapLike(val) {
  return (
    val !== null &&
    typeof val === "object" &&
    (val.constructor?.name === "Object" || Object.getPrototypeOf(val) === null)
  )
}
