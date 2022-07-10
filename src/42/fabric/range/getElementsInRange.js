const { ELEMENT_NODE } = Node

export default function getElementsInRange(range) {
  const start =
    range.startContainer.childNodes[range.startOffset] || range.startContainer
  const end =
    range.endContainer.childNodes[range.endOffset] || range.endContainer

  const nodes = []

  for (let node = start; node; node = node.nextSibling) {
    if (node === end) break
    if (node.nodeType === ELEMENT_NODE) nodes.push(node)
  }

  return nodes
}
