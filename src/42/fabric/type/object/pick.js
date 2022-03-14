export default function pick(obj, arr) {
  const out = {}
  for (const key of arr) {
    if (key in obj) out[key] = obj[key]
  }

  return out
}
