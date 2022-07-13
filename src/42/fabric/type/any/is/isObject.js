export default function isObject(val) {
  return (
    val !== null &&
    typeof val === "object" &&
    toString.call(val) === "[object Object]"
  )
}
