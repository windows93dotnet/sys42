export default function isHashmapLike(val) {
  return (
    val !== null &&
    typeof val === "object" &&
    (val.constructor === Object || Object.getPrototypeOf(val) === null)
  )
}
