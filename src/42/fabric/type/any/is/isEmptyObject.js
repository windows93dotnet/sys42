export default function isEmptyObject(x) {
  if (x === null || typeof x !== "object") return false
  for (const prop in x) if (Object.hasOwn(x, prop)) return false
  return true
}
