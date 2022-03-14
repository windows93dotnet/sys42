export const escapeRegExp = (str) => str.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&")
export default escapeRegExp
