import fromCamelCase from "./fromCamelCase.js"
import isCamelCase from "./isCamelCase.js"
import isLodashCase from "./isLodashCase.js"
import isHyphenCase from "./isHyphenCase.js"
import isUpperCase from "./isUpperCase.js"

export const toSentenceCase = (str) => {
  if (!str) return ""
  if (isCamelCase(str)) str = fromCamelCase(str).toLowerCase()
  else if (isLodashCase(str)) {
    str = str.replaceAll("_", " ").toLowerCase()
  } else if (isHyphenCase(str)) {
    str = str.replaceAll("-", " ").toLowerCase()
  } else if (isUpperCase(str)) str = str.toLowerCase()
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default toSentenceCase
