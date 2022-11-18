import splitWord from "./splitWord.js"

export const toConstantCase = splitWord((x) => x.toUpperCase(), "_")

export default toConstantCase
