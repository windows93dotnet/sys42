export function applyStyleDeclaration(el, styleDeclaration) {
  for (const item of styleDeclaration) {
    el.style[item] = styleDeclaration[item]
  }
}

export default applyStyleDeclaration
