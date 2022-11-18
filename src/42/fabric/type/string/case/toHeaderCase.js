import splitWord from "./splitWord.js"

export const toHeaderCase = splitWord(
  (x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase(),
  "-"
)

export default toHeaderCase
