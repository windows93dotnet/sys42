export default function sortPath(paths, key) {
  const splitted = paths.map((path) => ({
    path,
    segments: (key === undefined ? path : path[key])
      .split("/")
      .map((item, i, arr) => (i < arr.length - 1 ? `${item}/` : item))
      .filter(Boolean), // TODO: use flatMap
  }))

  splitted.sort(({ segments: a }, { segments: b }) => {
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i++) {
      if (i in a === false) return -1
      if (i in b === false) return 1
      const c = a[i].localeCompare(b[i])
      if (c === 0) continue
      const aIsDir = a[i].endsWith("/")
      const bIsDir = b[i].endsWith("/")
      if (aIsDir === bIsDir) return c
      if (aIsDir === false) return 1
      if (bIsDir === false) return -1
    }

    return 0
  })

  return splitted.map(({ path }) => path)
}
