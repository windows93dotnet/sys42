import { isPositiveInteger } from "../type/any/is.js"
import assertPath from "../type/path/assertPath.js"

export const decodeJSONPointer = (key) =>
  String(key).replace(/~1/g, "/").replace(/~0/g, "~")

export const encodeJSONPointer = (key) =>
  String(key).replace(/~/g, "~0").replace(/\//g, "~1")

export const decodeJSONPointerURI = (key) =>
  decodeJSONPointer(decodeURIComponent(key))

export const encodeJSONPointerURI = (key) =>
  encodeJSONPointer(encodeURIComponent(key).replace(/%24/g, "$"))

export const isNextLevelAnArray = (key) =>
  key === "-" || isPositiveInteger(Number(key))

export const splitJSONPointer = (path) => {
  if (Array.isArray(path)) return path
  assertPath(path)

  let sanitize = decodeJSONPointer
  if (path.startsWith("#")) {
    path = path.slice(1)
    sanitize = decodeJSONPointerURI
  }

  if (path.startsWith("/")) path = path.slice(1)
  return path.split("/").map(sanitize)
}

export const joinJSONPointer = (segments) =>
  segments.length === 0 ? "" : "/" + segments.map(encodeJSONPointer).join("/")

export const joinJSONPointerURI = (segments) =>
  segments.length === 0
    ? "#"
    : "#/" + segments.map(encodeJSONPointerURI).join("/")

export default {
  decode: decodeJSONPointer,
  encode: encodeJSONPointer,
  decodeURI: decodeJSONPointerURI,
  encodeURI: encodeJSONPointerURI,
  split: splitJSONPointer,
  join: joinJSONPointer,
  joinURI: joinJSONPointerURI,
}
