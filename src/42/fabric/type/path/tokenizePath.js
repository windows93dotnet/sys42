import trim from "../string/trim.js"
export default function tokenizePath(path) {
  return trim(path, "/").split("/")
}
