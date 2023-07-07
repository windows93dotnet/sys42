export const escapeRegExp = (str) =>
  str.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&")
export default escapeRegExp
