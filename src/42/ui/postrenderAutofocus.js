export function postrenderAutofocus(el) {
  const items = el.querySelectorAll(":scope [data-autofocus]")
  if (items.length > 0) {
    items[items.length - 1].focus()
    return true
  }

  return false
}

export default postrenderAutofocus
