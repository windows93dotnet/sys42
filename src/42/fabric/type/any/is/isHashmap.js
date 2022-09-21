export default function isHashmap(val) {
  return (
    val !== null &&
    typeof val === "object" &&
    Object.getPrototypeOf(val) === null
  )
}
