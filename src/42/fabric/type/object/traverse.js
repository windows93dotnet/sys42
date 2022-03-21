export default function traverse(obj, cb, parentKey) {
  for (const key of Object.keys(obj)) {
    cb(key, obj[key], obj, parentKey)
    if (typeof obj[key] === "object") traverse(obj[key], cb, key)
  }
}
