// @thanks https://gist.github.com/mathiasbynens/1243213#gistcomment-65937

export const charCodeToUnicode = (code) =>
  `\\u${code.toString(16).padStart(4, "0")}`

export const charCodeToHex = (code) =>
  `\\x${code.toString(16).padStart(2, "0")}`

export const escapeUnicode = (str, ignoreList = []) =>
  str.replaceAll(/[^\u0020-~]/g, (char) => {
    const code = char.charCodeAt(0)
    if (ignoreList.includes(code)) return char
    // prettier-ignore
    switch (code) {
      case 9: return "\\t"
      case 10: return "\\n"
      case 13: return "\\r"
      default: return code < 256
        ? charCodeToHex(code)
        : charCodeToUnicode(code)
    }
  })

// TODO: benchmark unescapeUnicode
export const unescapeUnicode = (str) => JSON.parse(`"${str}"`)

export default escapeUnicode
