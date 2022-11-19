export const encodeJSONPointer = (key) =>
  String(key).replaceAll("~", "~0").replaceAll("/", "~1")

export const encodeJSONPointerURI = (key) =>
  encodeJSONPointer(encodeURIComponent(key).replaceAll("%24", "$"))

export const joinJSONPointer = (segments) =>
  segments.length === 0 ? "" : "/" + segments.map(encodeJSONPointer).join("/")

export const joinJSONPointerURI = (segments) =>
  segments.length === 0
    ? "#"
    : "#/" + segments.map(encodeJSONPointerURI).join("/")

export default joinJSONPointer
