// TODO: use toLocaleLowerCase https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLocaleLowerCase

import deburr from "./deburr.js"

const WORDS_REGEX = /[A-Z]?[a-z]+\d*|[\dA-Za-z]+/g
const SMALL_WORDS =
  /\b(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v.?|vs.?|via)\b/gi

const HYPHEN_REGEX = /^[a-z][\da-z-]*$/
const LODASH_REGEX = /^[a-z][\d_a-z]*$/

const HYPHEN_REGEX_I = new RegExp(HYPHEN_REGEX.source, "i")
const LODASH_REGEX_I = new RegExp(LODASH_REGEX.source, "i")

export const isCamelCase = (str) => /^[A-Za-z][\dA-Za-z]*$/.test(str)
export const isKebabCase = (str) => HYPHEN_REGEX.test(str)
export const isSnakeCase = (str) => LODASH_REGEX.test(str)
export const isUpperCase = (str) => str === str.toUpperCase()
export const isLowerCase = (str) => str === str.toLowerCase()

const fromCamelCase = (str) =>
  str
    .replace(/([\da-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][\da-z]+)/g, "$1 $2")

export const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

export const toSentenceCase = (str) => {
  if (!str) return ""
  if (isCamelCase(str)) str = fromCamelCase(str).toLowerCase()
  else if (LODASH_REGEX_I.test(str)) str = str.replace(/_/g, " ").toLowerCase()
  else if (HYPHEN_REGEX_I.test(str)) str = str.replace(/-/g, " ").toLowerCase()
  else if (isUpperCase(str)) str = str.toLowerCase()
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toCapitalCase = (str) => {
  if (!str) return ""
  if (isCamelCase(str)) str = fromCamelCase(str)
  else if (LODASH_REGEX_I.test(str)) str = str.replace(/_/g, " ")
  else if (HYPHEN_REGEX_I.test(str)) str = str.replace(/-/g, " ")
  // return str.replace(/\S+/g, (_) => capitalize(_))
  return str.replace(WORDS_REGEX, (_) => capitalize(_))
}

export const toTitleCase = (str) => {
  if (!str) return ""
  str = toCapitalCase(str)
  return str.replace(SMALL_WORDS, (_) => (_ === str ? _ : _.toLowerCase()))
}

export const toUpperCase = (str) =>
  isCamelCase(str) ? fromCamelCase(str).toUpperCase() : str.toUpperCase()

export const toLowerCase = (str) =>
  isCamelCase(str) ? fromCamelCase(str).toLowerCase() : str.toLowerCase()

const splitWord =
  (each, joiner = "") =>
  (str) =>
    str ? deburr(str).match(WORDS_REGEX).map(each).join(joiner) : ""

export const toNoCase = splitWord((x) => x.toLowerCase(), " ")

export const toKebabCase = splitWord((x) => x.toLowerCase(), "-")

export const toSnakeCase = splitWord((x) => x.toLowerCase(), "_")

export const toConstantCase = splitWord((x) => x.toUpperCase(), "_")

export const toHeaderCase = splitWord(
  (x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase(),
  "-"
)

export const toPascalCase = (str, ignoreAcronyms) =>
  ignoreAcronyms || isUpperCase(str)
    ? splitWord((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())(
        str
      )
    : splitWord((x) =>
        isUpperCase(x)
          ? x
          : x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()
      )(str)

export const toCamelCase = (str, ignoreAcronyms) =>
  ignoreAcronyms || isUpperCase(str)
    ? splitWord((x, i) =>
        i > 0
          ? x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()
          : x.toLowerCase()
      )(str)
    : splitWord((x, i) =>
        isUpperCase(x)
          ? x
          : i > 0
          ? x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()
          : x.toLowerCase()
      )(str)
