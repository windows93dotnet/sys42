import fromCamelCase from "./fromCamelCase.js"
import isCamelCase from "./isCamelCase.js"
import isLodashCase from "./isLodashCase.js"
import isHyphenCase from "./isHyphenCase.js"

export const toUpperCase = (str) =>
  isCamelCase(str)
    ? fromCamelCase(str).toUpperCase()
    : isLodashCase(str)
    ? str.replaceAll("_", " ").toUpperCase()
    : isHyphenCase(str)
    ? str.replaceAll("-", " ").toUpperCase()
    : str.toUpperCase()

export default toUpperCase
