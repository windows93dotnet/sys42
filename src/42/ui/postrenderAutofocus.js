/* eslint-disable unicorn/prefer-at */
export function postrenderAutofocus(el) {
  const items = el.querySelectorAll(":scope [data-autofocus]")

  if (items.length > 0) {
    const item = items[items.length - 1]
    if (item === document.activeElement) return true
    item.focus({ preventScroll: true })
    item.setSelectionRange?.(0, 0)
    return true
  }

  return false
}

export default postrenderAutofocus
