const defaultStyles = {}

const iframe = document.createElement("iframe")
iframe.srcdoc = `<div></div><script>globalThis.defaultStyles = getComputedStyle(document.querySelector("div"))</script>`
iframe.addEventListener(
  "load",
  () => {
    const x = iframe.contentWindow.defaultStyles
    for (const item of x) defaultStyles[item] = x[item]
    delete defaultStyles.display
    iframe.remove()
  },
  { once: true }
)
document.documentElement.append(iframe)

export function applyStyleDeclaration(el, styleDeclaration) {
  for (const item of styleDeclaration) {
    if (styleDeclaration[item] === defaultStyles[item]) continue
    el.style[item] = styleDeclaration[item]
  }
}

export default applyStyleDeclaration
