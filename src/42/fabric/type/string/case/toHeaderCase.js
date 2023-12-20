import combineWords from "./combineWords.js"

export const toHeaderCase = combineWords(
  (x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase(),
  "-",
)

export default toHeaderCase
