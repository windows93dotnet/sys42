export function distribute(obj, ...keyLists) {
  const out = Array.from({ length: keyLists.length + 1 }, () => ({}))

  main: for (const [key, val] of Object.entries(obj)) {
    for (let i = 0, l = keyLists.length; i < l; i++) {
      const keys = keyLists[i]
      if (keys.includes(key)) {
        out[i + 1][key] = val
        continue main
      }
    }

    out[0][key] = val
  }

  return out
}

export default distribute
