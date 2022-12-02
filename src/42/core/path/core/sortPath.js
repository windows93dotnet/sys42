import getPathInfos from "../getPathInfos.js"
import locate from "../../../fabric/locator/locate.js"

export default function sortPath(paths, options) {
  const type =
    options?.type ?? (typeof options === "string" ? options : undefined)

  if (type) {
    const splitted = paths.map((path) => ({
      path,
      infos: getPathInfos(
        options?.key === undefined ? path : path[options.key]
      ),
    }))

    splitted.sort(({ infos: a }, { infos: b }) => {
      if (a.isDir === b.isDir) {
        const res = locate(a, type).localeCompare(locate(b, type))
        if (res === 0) return a.stem.localeCompare(b.stem)
        return res
      }

      return a.isDir === false ? 1 : b.isDir === false ? -1 : 0
    })

    return splitted.map(({ path }) => path)
  }

  const splitted = paths.map((path) => ({
    path,
    segments: (options?.key === undefined ? path : path[options.key])
      .split("/")
      .map((item, i, arr) => (i < arr.length - 1 ? `${item}/` : item))
      .filter(Boolean), // TODO: use flatMap
  }))

  splitted.sort(({ segments: a }, { segments: b }) => {
    const l = Math.max(a.length, b.length)
    for (let i = 0; i < l; i++) {
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
