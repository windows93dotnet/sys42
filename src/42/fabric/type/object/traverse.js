export default function traverse(obj, cb, parentKey) {
  if (parentKey === undefined && !(obj && typeof obj === "object")) return obj

  for (const [key, val] of Object.entries(obj)) {
    cb(key, val, obj, parentKey)
    if (val && typeof val === "object") traverse(val, cb, key)
  }

  return obj
}
