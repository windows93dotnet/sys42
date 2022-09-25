import trim from "../../../fabric/type/string/trim.js"

export default function tokenizePath(path) {
  return trim(path, "/").split("/")
}
