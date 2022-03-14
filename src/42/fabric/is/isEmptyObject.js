const { hasOwnProperty } = Object.prototype

export default function isEmptyObject(x) {
  if (x === null || typeof x !== "object") return false
  for (const prop in x) if (hasOwnProperty.call(x, prop)) return false
  return true
}
