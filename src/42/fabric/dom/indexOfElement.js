export function indexOfElement(el, parent = el?.parentElement) {
  if (!parent) return -1

  const { children } = parent

  for (let i = 0, l = children.length; i < l; i++) {
    if (children[i] === el) return i
  }

  return -1
}

export function getElementIndex(el) {
  let i = 0
  while ((el = el.previousElementSibling)) i++
  return i
}

export default indexOfElement
