import isFocusable from "./isFocusable.js"

export function ensureFocusable(el, options) {
  if (isFocusable(el)) return el

  const attr = el.getAttribute("tabIndex")
  el.tabIndex = options?.tabIndex ?? 0

  options?.signal.addEventListener("abort", () => {
    if (attr === null) el.removeAttribute("tabIndex")
    else el.tabIndex = attr
  })

  return el
}

export default ensureFocusable
