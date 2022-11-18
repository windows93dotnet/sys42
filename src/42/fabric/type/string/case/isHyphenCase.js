export const HYPHEN_REGEX = /^[a-z][\da-z-]*$/i
export const isHyphenCase = (str) => HYPHEN_REGEX.test(str)
export default isHyphenCase
