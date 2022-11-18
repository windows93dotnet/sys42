export const fromCamelCase = (str) =>
  str
    .replace(/([\da-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][\da-z]+)/g, "$1 $2")
export default fromCamelCase
