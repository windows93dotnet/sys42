import assertPath from "../../core/path/assertPath.js"

export const decodeJSONPointer = (key) =>
  String(key).replaceAll("~1", "/").replaceAll("~0", "~")

export const encodeJSONPointer = (key) =>
  String(key).replaceAll("~", "~0").replaceAll("/", "~1")

export const decodeJSONPointerURI = (key) =>
  decodeJSONPointer(decodeURIComponent(key))

export const encodeJSONPointerURI = (key) =>
  encodeJSONPointer(encodeURIComponent(key).replaceAll("%24", "$"))

// TODO: write real parser
export default function splitJSONPointer(path) {
  if (Array.isArray(path)) return path

  assertPath(path)

  let sanitize = decodeJSONPointer
  if (path.startsWith("#")) {
    path = path.slice(1)
    sanitize = decodeJSONPointerURI
  }

  if (path.startsWith("/")) {
    path = path.slice(1)
  }

  return path.split("/").map(sanitize).filter(Boolean)
}
