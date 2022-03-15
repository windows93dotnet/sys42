export default function flatten(obj, sep = ".", prefix = "") {
  const out = {}

  for (const [key, val] of Object.entries(obj)) {
    const pre = prefix.length > 0 ? prefix + sep : ""
    if (val && typeof val === "object") {
      const res = flatten(val, sep, pre + key)
      if (Object.keys(res).length > 0) {
        Object.assign(out, res)
        continue
      }
    }

    out[pre + key] = val
  }

  return out
}

flatten.entries = (obj, sep = ".", prefix = "") => {
  const out = []

  for (const [key, val] of Object.entries(obj)) {
    const pre = prefix.length > 0 ? prefix + sep : ""
    if (val && typeof val === "object") {
      const res = flatten.entries(val, sep, pre + key)
      if (res.length > 0) {
        out.push(...res)
        continue
      }
    }

    out.push([pre + key, val])
  }

  return out
}

flatten.keys = (obj, sep = ".", prefix = "") => {
  const out = []

  for (const [key, val] of Object.entries(obj)) {
    const pre = prefix.length > 0 ? prefix + sep : ""
    if (val && typeof val === "object") {
      const res = flatten.keys(val, sep, pre + key)
      if (res.length > 0) {
        out.push(...res)
        continue
      }
    }

    out.push(pre + key)
  }

  return out
}
