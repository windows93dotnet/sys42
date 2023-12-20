import parseWords from "./parseWords.js"

export const combineWords =
  (each, joiner = "") =>
  (str) =>
    parseWords(str, each).join(joiner)

export default combineWords
