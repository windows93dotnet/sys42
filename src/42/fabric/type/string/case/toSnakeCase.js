import splitWord from "./splitWord.js"

export const toSnakeCase = splitWord((x) => x.toLowerCase(), "_")

export default toSnakeCase
