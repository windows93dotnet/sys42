export function pick(obj, arr, out) {
  if (!obj) return
  out ??= {}

  for (const key of arr) {
    if (key in obj) out[key] = obj[key]
  }

  return out
}

export default pick
