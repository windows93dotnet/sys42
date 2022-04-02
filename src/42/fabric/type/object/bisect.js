export default function bisect(obj, arr) {
  const a = {}
  const b = {}

  for (const key of Object.keys(obj)) {
    if (arr.includes(key)) b[key] = obj[key]
    else a[key] = obj[key]
  }

  return [a, b]
}
