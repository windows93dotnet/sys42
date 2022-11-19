export default function flatten(obj, delimiter = ".", prefix = "") {
  const out = {}

  for (const [key, val] of Object.entries(obj)) {
    const pre = prefix.length > 0 ? prefix + delimiter : ""
    if (val && typeof val === "object") {
      const res = flatten(val, delimiter, pre + key)
      if (Object.keys(res).length > 0) {
        Object.assign(out, res)
        continue
      }
    }

    out[pre + key] = val
  }

  return out
}

flatten.entries = (obj, delimiter = ".", prefix = "") => {
  const out = []

  for (const [key, val] of Object.entries(obj)) {
    const pre = prefix.length > 0 ? prefix + delimiter : ""
    if (val && typeof val === "object") {
      const res = flatten.entries(val, delimiter, pre + key)
      if (res.length > 0) {
        out.push(...res)
        continue
      }
    }

    out.push([pre + key, val])
  }

  return out
}

flatten.keys = (obj, delimiter = ".", prefix = "") => {
  const out = []

  for (const [key, val] of Object.entries(obj)) {
    const pre = prefix.length > 0 ? prefix + delimiter : ""
    if (val && typeof val === "object") {
      const res = flatten.keys(val, delimiter, pre + key)
      if (res.length > 0) {
        out.push(...res)
        continue
      }
    }

    out.push(pre + key)
  }

  return out
}
