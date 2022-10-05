export default function getNodesInRange(range) {
  const start =
    range.startOffset > range.startContainer.childNodes.length
      ? range.startContainer.lastChild
      : range.startContainer.childNodes[range.startOffset]
  const end =
    range.endOffset > range.endContainer.childNodes.length
      ? range.endContainer.lastChild
      : range.endContainer.childNodes[range.endOffset]

  const nodes = []

  for (let node = start; node; node = node.nextSibling) {
    if (node === end) break
    nodes.push(node)
  }

  return nodes
}
