import deburr from "../deburr.js"

export const WORDS_REGEX = /[A-Z]?[a-z]+\d*|[\dA-Za-z]+/g

export const splitWord =
  (each, joiner = "") =>
  (str) =>
    str ? deburr(str).match(WORDS_REGEX).map(each).join(joiner) : ""

export default splitWord
