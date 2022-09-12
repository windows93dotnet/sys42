export default function traverse(obj, cb, parentKey, memory = new WeakSet()) {
  if (memory.has(obj)) return
  if (parentKey === undefined && !(obj && typeof obj === "object")) return obj

  memory.add(obj)

  for (const [key, val] of Object.entries(obj)) {
    cb(key, val, obj, parentKey)
    if (val && typeof val === "object") traverse(val, cb, key, memory)
  }

  return obj
}
