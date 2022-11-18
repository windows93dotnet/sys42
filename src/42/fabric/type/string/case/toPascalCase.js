import splitWord from "./splitWord.js"
import isUpperCase from "./isUpperCase.js"

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

export default toPascalCase
