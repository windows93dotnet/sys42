export const fromCamelCase = (str) =>
  str
    .replaceAll(/([\da-z])([A-Z])/g, "$1 $2")
    .replaceAll(/([A-Z]+)([A-Z][\da-z]+)/g, "$1 $2")
export default fromCamelCase
