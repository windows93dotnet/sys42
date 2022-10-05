export default function indexOfNode(node, parent = node.parentElement) {
  const { childNodes } = parent

  for (let i = 0, l = childNodes.length; i < l; i++) {
    if (childNodes[i] === node) return i
  }

  return -1
}
