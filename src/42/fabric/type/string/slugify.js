import deburr from "./deburr.js"
import toKebabCase from "./case/toKebabCase.js"

export function slugify(str, options) {
  str = deburr(str)

  if (options?.preserveUnicode) {
    str = str
      .replaceAll(/[^\d A-Za-z]/g, (char) => " " + char.charCodeAt(0) + " ")
      .trim()
  }

  return options?.kebabCase === false
    ? str.replaceAll(/\s/g, "-")
    : toKebabCase(str)
}

export default slugify
