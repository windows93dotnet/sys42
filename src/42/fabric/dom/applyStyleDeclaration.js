const defaultStyles = {}

void (() => {
  const div = document.createElement("div")
  document.documentElement.append(div)
  const styles = getComputedStyle(div)
  for (const item of styles) defaultStyles[item] = styles[item]
  delete defaultStyles.display
  div.remove()
})()

export function applyStyleDeclaration(el, styleDeclaration) {
  for (const item of styleDeclaration) {
    if (styleDeclaration[item] === defaultStyles[item]) continue
    el.style[item] = styleDeclaration[item]
  }
}

export default applyStyleDeclaration
