import fromCamelCase from "./fromCamelCase.js"
import isCamelCase from "./isCamelCase.js"
import isLodashCase from "./isLodashCase.js"
import isHyphenCase from "./isHyphenCase.js"

export const toLowerCase = (str) =>
  isCamelCase(str)
    ? fromCamelCase(str).toLowerCase()
    : isLodashCase(str)
    ? str.replaceAll("_", " ").toLowerCase()
    : isHyphenCase(str)
    ? str.replaceAll("-", " ").toLowerCase()
    : str.toLowerCase()

export default toLowerCase
