import splitWord from "./splitWord.js"

export const toKebabCase = splitWord((x) => x.toLowerCase(), "-")

export default toKebabCase
