export function appendCSS(cssText, options) {
  if (cssText && typeof cssText !== "string") {
    options = cssText
    cssText = ""
  }

  const el = document.createElement("style")
  if (options?.id) el.id = options.id
  el.textContent = cssText
  document.head.append(el)

  options?.signal?.addEventlistener?.("abort", () => el.remove())

  return {
    el,
    update(val) {
      cssText = val
      el.textContent = cssText
    },
    enable() {
      el.textContent = cssText
    },
    disable() {
      el.textContent = ""
    },
    destroy: () => el.remove(),
  }
}

export default appendCSS
