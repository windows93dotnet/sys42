export default function isPlainObject(val) {
  return val !== null && typeof val === "object" && val.constructor === Object
}
