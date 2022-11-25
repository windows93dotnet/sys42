export function indexOfElement(node, parent = node?.parentElement) {
  if (!parent) return -1

  const { children } = parent

  for (let i = 0, l = children.length; i < l; i++) {
    if (children[i] === node) return i
  }

  return -1
}

export default indexOfElement
