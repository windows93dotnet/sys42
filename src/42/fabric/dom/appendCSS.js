export function appendCSS(cssText, options) {
  if (cssText && typeof cssText !== "string") {
    options = cssText
    cssText = ""
  }

  const el = document.createElement("style")
  if (options?.id) el.id = options.id
  el.textContent = cssText
  document.head.append(el)

  const out = {
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
    destroy() {
      el.remove()
      options?.signal?.removeEventlistener?.("abort", out.destroy)
    },
  }

  options?.signal?.addEventlistener?.("abort", out.destroy)

  return out
}

export default appendCSS
