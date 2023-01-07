export function indexOfNode(node, parent = node?.parentElement) {
  if (!parent) return -1

  const { childNodes } = parent

  for (let i = 0, l = childNodes.length; i < l; i++) {
    if (childNodes[i] === node) return i
  }

  return -1
}

export function getNodeIndex(node) {
  let i = 0
  while ((node = node.previousSibling)) i++
  return i
}

export default indexOfNode
