import combineWords from "./combineWords.js"
import isUpperCase from "./isUpperCase.js"

export const toPascalCase = (str, ignoreAcronyms) =>
  ignoreAcronyms || isUpperCase(str)
    ? combineWords(
        (x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase(),
      )(str)
    : combineWords((x) =>
        isUpperCase(x)
          ? x
          : x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase(),
      )(str)

export default toPascalCase
