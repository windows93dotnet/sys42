export default function sortGlobResults(paths, key) {
  const splitted = paths.map((path) => {
    const x = key === undefined ? path : path[key]
    const y = x.split("/")
    const segments = x.endsWith("/") ? y.at(-2) + "/" : y.at(-1)
    return {
      path,
      segments,
    }
  })

  splitted.sort(({ segments: a }, { segments: b }) => {
    const c = a.localeCompare(b)
    const aIsDir = a.endsWith("/")
    const bIsDir = b.endsWith("/")
    if (aIsDir === bIsDir) return c
    if (aIsDir === false) return 1
    if (bIsDir === false) return -1
    return c
  })

  return splitted.map(({ path }) => path)
}
