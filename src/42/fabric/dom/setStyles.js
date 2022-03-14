import cssPrefix from "../cssom/cssPrefix.js"

export function setStyle(el, key, val) {
  const firstLetter = key.charAt(0)
  if (firstLetter === "_") return
  if (firstLetter !== "-") {
    const prefixed = cssPrefix(key)
    if (prefixed) el.style[prefixed] = val
  }

  if (key in el.style) el.style[key] = val
  else el.style.setProperty(key, val)
}

export default function setStyles(el, styles) {
  if (styles) {
    const type = typeof styles
    if (type === "string") {
      el.style.cssText = styles
    } else if (type === "object") {
      for (const key in styles) setStyle(el, key, styles[key])
    }
  } else {
    el.removeAttribute("style")
  }

  return el
}
