export default function isEmptyObject(val) {
  if (val === null || typeof val !== "object") return false
  for (const prop in val) if (Object.hasOwn(val, prop)) return false
  return true
}
