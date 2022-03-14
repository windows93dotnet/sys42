import setup from "../../../system/setup.js"
import { escapeLog, removeStyles } from "../logUtils.js"

const DEFAULTS = {
  newline: "\n",
  colon: " ",
  space: ".",
  valuePrefix: " ",
  margin: 3,
  minSpaceLength: 18,
  keyFormater: (x, color) => `{${color} ${escapeLog(String(x))}}`,
  valueFormater: (x, color) => `{${color} ${escapeLog(String(x))}}`,
  colors: {
    key: "reset.dim",
    value: "white.dim",
    colon: "white.dim",
    space: "grey.dim",
    punctuation: "white.dim",
  },
}

const PRESETS = {
  dots: {
    colon: " ",
    space: ".",
    valuePrefix: " ",
    margin: 3,
  },

  javascript: {
    colors: {
      key: "yellow",
    },
    newline: ",\n",
    colon: ":",
    space: " ",
    valuePrefix: "",
    margin: 1,
    minSpaceLength: 1,
  },
}

const configure = setup("formatEntries", DEFAULTS, PRESETS)

export default function formatEntries(entries, options) {
  const config = configure(options)

  const {
    colors,
    space,
    colon,
    newline,
    margin,
    minSpaceLength,
    valuePrefix,
    keyFormater,
    valueFormater,
  } = config

  let out = ""

  if (!entries) return out

  if (!Array.isArray(entries)) {
    entries =
      typeof entries.entries === "function"
        ? [...entries.entries()]
        : Object.entries(entries)
  }

  const keysLength = {}
  entries.forEach(([key]) => {
    keysLength[key] = removeStyles(key).length
  })

  const maxLen = Math.max(
    minSpaceLength,
    Math.max(...Object.values(keysLength)) + margin
  )

  entries.forEach(([key, value], i) => {
    const spaces = `{${colors.space} ${space.repeat(maxLen - keysLength[key])}}`
    key = keyFormater ? keyFormater(key, colors.key) : key
    value = valueFormater ? valueFormater(value, colors.value) : value
    out += `\
${key}{${colors.colon} ${colon}}${spaces}${valuePrefix}\
${value}{${colors.punctuation} `
    out += i === entries.length - 1 ? `${newline.trimEnd()}}\n` : `${newline}}`
  })
  return out
}
