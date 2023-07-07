import toCapitalCase from "./toCapitalCase.js"

export const SMALL_WORDS =
  /\b(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v.?|vs.?|via)\b/gi

export const toTitleCase = (str) => {
  if (!str) return ""
  str = toCapitalCase(str)
  return str.replaceAll(SMALL_WORDS, (_) => (_ === str ? _ : _.toLowerCase()))
}

export default toTitleCase
