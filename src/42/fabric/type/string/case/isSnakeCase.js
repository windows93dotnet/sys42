export const LODASH_REGEX = /^[a-z][\d_a-z]*$/
export const isSnakeCase = (str) => LODASH_REGEX.test(str)
export default isSnakeCase
