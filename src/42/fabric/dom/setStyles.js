import cssPrefix from "./cssPrefix.js"

export function setStyle(el, key, val) {
  if (key.startsWith("--")) el.style.setProperty(key, val)
  else {
    const prefixed = cssPrefix(key)
    if (prefixed && prefixed in el.style) el.style[prefixed] = val
    if (key in el.style) el.style[key] = val
  }
}

export default function setStyles(el, styles) {
  if (styles) {
    const type = typeof styles
    if (type === "string") {
      el.style.cssText = styles
    } else if (type === "object") {
      for (const key of Object.keys(styles)) setStyle(el, key, styles[key])
    }
  } else {
    el.removeAttribute("style")
  }

  return el
}
