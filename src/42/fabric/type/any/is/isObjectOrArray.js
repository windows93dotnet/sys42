export default function isObjectOrArray(val) {
  return val !== null && typeof val === "object"
}
