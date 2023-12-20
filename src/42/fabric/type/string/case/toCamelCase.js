import combineWords from "./combineWords.js"
import isUpperCase from "./isUpperCase.js"

export const toCamelCase = (str, ignoreAcronyms) =>
  ignoreAcronyms || isUpperCase(str)
    ? combineWords((x, i) =>
        i > 0
          ? x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()
          : x.toLowerCase(),
      )(str)
    : combineWords((x, i) =>
        isUpperCase(x)
          ? x
          : i > 0
            ? x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase()
            : x.toLowerCase(),
      )(str)

export default toCamelCase
