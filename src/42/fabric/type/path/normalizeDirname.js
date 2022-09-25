export default function normalizeDirname(path) {
  return path.endsWith("/") ? path : `${path}/`
}
