export const CAMELCASE_REGEX = /^[A-Za-z][\dA-Za-z]*$/
export const isCamelCase = (str) => CAMELCASE_REGEX.test(str)
export default isCamelCase
