const killKeys = [
  "destroy",
  "cancel",
  "abort",
  "remove",
  "close",
  "clear",
  "resolve",
  "unregister",
  "terminate",
  "forget",
  "dispose",
]

export default async function kill(val, report) {
  if (!val) return true

  try {
    if (typeof val === "string") {
      if (val.startsWith("blob:")) {
        URL.revokeObjectURL(val)
        return true
      }

      return false
    }

    if (Array.isArray(val)) {
      val.length = 0
      return true
    }

    for (const key of killKeys) {
      if (typeof val[key] === "function") {
        await val[key]()
        return true
      }
    }
  } catch (err) {
    report?.(err)
  }

  return false
}
