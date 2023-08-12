export const isVisible = (el) =>
  Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length > 0)

export function isFocusable(el, options) {
  if (el === window) return true

  if (!el || el.tabIndex < 0 || el.disabled) return false

  if (
    options?.checkIfVisible !== false &&
    (!el.isConnected || !isVisible(el))
  ) {
    return false
  }

  if (
    el.tabIndex > 0 ||
    (el.tabIndex === 0 && el.getAttribute("tabIndex") !== null) ||
    el.getAttribute("contenteditable") === "true"
  ) {
    return true
  }

  // prettier-ignore
  switch (el.localName) {
    case "a": return Boolean(el.href) && el.rel !== "ignore"
    case "input": return el.type !== "hidden"
    case "button":
    case "select":
    case "textarea": return true
    default: return false
  }
}

export default isFocusable
