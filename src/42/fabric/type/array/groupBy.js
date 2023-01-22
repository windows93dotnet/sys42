export function groupBy(arr, fn, obj = Object.create(null)) {
  if (typeof fn === "string") {
    const key = fn
    fn = (item) => item[key]
  }

  for (const item of arr) {
    const key = fn(item)
    if (!obj[key]) obj[key] = []
    obj[key].push(item)
  }

  return obj
}

export default groupBy
