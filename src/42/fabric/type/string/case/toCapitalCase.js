import capitalize from "./capitalize.js"
import fromCamelCase from "./fromCamelCase.js"
import isCamelCase from "./isCamelCase.js"
import isLodashCase from "./isLodashCase.js"
import isHyphenCase from "./isHyphenCase.js"

const WORDS_REGEX = /[A-Z]?[a-z]+\d*|[\dA-Za-z]+/g

export const toCapitalCase = (str) => {
  if (!str) return ""
  if (isCamelCase(str)) str = fromCamelCase(str)
  else if (isLodashCase(str)) str = str.replaceAll("_", " ")
  else if (isHyphenCase(str)) str = str.replaceAll("-", " ")
  return str.replaceAll(WORDS_REGEX, (_) => capitalize(_))
}

export default toCapitalCase
