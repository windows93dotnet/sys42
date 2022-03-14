import parseLogTemplate from "./parseLogTemplate.js"

export const removeStyles = (str) => {
  const tokens = parseLogTemplate(str)
  let out = ""
  for (const { type, buffer } of tokens) {
    if (type === "text") out += buffer
  }

  return out
}

export const addStyle = (str, style) =>
  str && style ? esc`{${style} ${escapeLog(str)}}` : str

export const escapeLog = (str) =>
  str
    .replaceAll("\\}", "\\\\}")
    .replaceAll("\\{", "\\\\{")
    .replaceAll(/([^\\}])?}/g, "$1\\}")
    .replaceAll(/([^\\{])?{/g, "$1\\{")
    .replaceAll(/^{/g, "\\{")

export const unescapeLog = (str) =>
  str.replaceAll("\\}", "}").replaceAll("\\{", "{")

export const esc = (strings, ...keys) => {
  let out = strings[0]
  for (let i = 0, l = keys.length; i < l; i++) {
    out += escapeLog(String(keys[i])) + strings[i + 1]
  }

  return out
}
