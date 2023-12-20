import combineWords from "./combineWords.js"

export const toConstantCase = combineWords((x) => x.toUpperCase(), "_")

export default toConstantCase
