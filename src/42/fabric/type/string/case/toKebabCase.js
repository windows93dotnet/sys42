import combineWords from "./combineWords.js"

export const toKebabCase = combineWords((x) => x.toLowerCase(), "-")

export default toKebabCase
