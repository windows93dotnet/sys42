export const LODASH_REGEX = /^[a-z]\w*$/i
export const isLodashCase = (str) => LODASH_REGEX.test(str)
export default isLodashCase
