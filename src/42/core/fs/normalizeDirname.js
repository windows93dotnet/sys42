import normalizeFilename from "./normalizeFilename.js"

export default function normalizeDirname(path) {
  path = normalizeFilename(path)
  return path.endsWith("/") ? path : `${path}/`
}
