export default function bisect(obj, arr) {
  const a = {}
  const b = {}

  for (const [key, val] of Object.entries(obj)) {
    if (arr.includes(key)) b[key] = val
    else a[key] = val
  }

  return [a, b]
}
