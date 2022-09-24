export default function omit(obj, arr, out) {
  if (!obj) return
  out ??= {}

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      if (!arr.includes(key)) out[key] = obj[key]
    }
  }

  return out
}
