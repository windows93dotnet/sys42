import cssPrefix from "../cssom/cssPrefix.js"
import capitalize from "../type/string/case/capitalize.js"

const { isFinite } = Number

const POSITIONS = ["top", "bottom", "left", "right"]
const SHORTHANDS = ["margin", "padding"]
const SIZES = new Set(["width", "height", ...POSITIONS, ...SHORTHANDS])

for (const shorthand of SHORTHANDS) {
  for (const pos of POSITIONS) {
    SIZES.add(`${shorthand}${capitalize(pos)}`)
  }
}

export function setStyle(el, key, val) {
  if (key.startsWith("--")) el.style.setProperty(key, val)
  else {
    if (SIZES.has(key)) val = isFinite(val) ? `${val}px` : val
    const prefixed = cssPrefix(key)
    if (prefixed && prefixed in el.style) el.style[prefixed] = val
    if (key in el.style) el.style[key] = val
  }
}

export function setStyles(el, styles) {
  if (styles) {
    const type = typeof styles
    if (type === "string") {
      el.style = styles
    } else if (type === "object") {
      for (const key of Object.keys(styles)) setStyle(el, key, styles[key])
    }
  } else {
    el.removeAttribute("style")
  }

  return el
}

export default setStyles
