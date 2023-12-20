import combineWords from "./combineWords.js"

export const toSnakeCase = combineWords((x) => x.toLowerCase(), "_")

export default toSnakeCase
