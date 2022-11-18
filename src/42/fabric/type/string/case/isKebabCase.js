export const HYPHEN_REGEX = /^[a-z][\da-z-]*$/
export const isKebabCase = (str) => HYPHEN_REGEX.test(str)
export default isKebabCase
