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
]

export default async function kill(val, report) {
  try {
    if (typeof val === "string") {
      if (val.startsWith("blob:")) return URL.revokeObjectURL(val) ?? true
      return false
    }

    if (Array.isArray(val)) {
      val.length = 0
      return true
    }

    for (const key of killKeys) {
      if (typeof val[key] === "function") return (await val[key]()) ?? true
    }
  } catch (err) {
    report?.(err)
  }

  return false
}
