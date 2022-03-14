export default function omit(obj, arr) {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (!arr.includes(key)) {
      out[key] = obj[key]
    }
  }

  return out
}
