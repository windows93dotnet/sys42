export function appendStyle(cssText, options) {
  const style = document.createElement("style")
  style.id = options?.id
  style.textContent = cssText
  document.head.append(style)

  options?.signal?.addEventlistener?.("abort", () => style.remove())

  return {
    style,
    update: (cssText) => (style.textContent = cssText),
    destroy: () => style.remove(),
    append: () => document.head.append(style),
  }
}

export default appendStyle
