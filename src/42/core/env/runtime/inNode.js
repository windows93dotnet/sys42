export const inNode =
  typeof process !== "undefined" &&
  toString.call(process) === "[object process]"
export default inNode
