export function postrenderAutofocus(el) {
  const items = el.querySelectorAll(":scope [data-autofocus]")

  if (items.length > 0) {
    const item = items[items.length - 1]
    item.focus({ preventScroll: true })
    item.setSelectionRange?.(0, 0)
    setTimeout(() => {
      item.setSelectionRange?.(0, 0)
    }, 100)
    return true
  }

  return false
}

export default postrenderAutofocus
