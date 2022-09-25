import { isPositiveInteger } from "../type/any/is.js"
import assertPath from "../../core/path/assertPath.js"

export const decodeJSONPointer = (key) =>
  String(key).replaceAll("~1", "/").replaceAll("~0", "~")

export const encodeJSONPointer = (key) =>
  String(key).replaceAll("~", "~0").replaceAll("/", "~1")

export const decodeJSONPointerURI = (key) =>
  decodeJSONPointer(decodeURIComponent(key))

export const encodeJSONPointerURI = (key) =>
  encodeJSONPointer(encodeURIComponent(key).replaceAll("%24", "$"))

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
