export default function hashmap(obj) {
  return obj ? Object.assign(Object.create(null), obj) : Object.create(null)
}

hashmap.fromEntries = (entries) => {
  const out = Object.create(null)
  for (const [key, val] of entries) out[key] = val
  return out
}
