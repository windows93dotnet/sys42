// @src https://www.30secondsofcode.org/js/s/prefix

const CSS_PREFIXES = ["webkit", "moz", "ms", "o"]

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

export default function cssPrefix(prop) {
  if (prop in document.body.style) return false
  prop = prop.split("-").map(capitalize).join("")
  const i = CSS_PREFIXES.findIndex(
    (prefix) => prefix + prop in document.body.style,
  )
  return i === -1 ? false : CSS_PREFIXES[i] + prop
}
