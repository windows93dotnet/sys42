const decodeJSONPointer = (key) =>
  String(key).replaceAll("~1", "/").replaceAll("~0", "~")

const decodeJSONPointerURI = (key) => decodeJSONPointer(decodeURIComponent(key))

export default function splitJSONPointer(path) {
  if (!path) return []

  let sanitize = decodeJSONPointer
  if (path.startsWith("#")) {
    path = path.slice(1)
    sanitize = decodeJSONPointerURI
  }

  if (path.startsWith("/")) {
    path = path.slice(1)
  }

  return path.split("/").map(sanitize)
}
