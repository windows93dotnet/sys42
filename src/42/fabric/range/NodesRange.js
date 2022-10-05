import getNodesInRange from "./getNodesInRange.js"
import indexOfNode from "./indexOfNode.js"

export default class NodesRange extends StaticRange {
  constructor(startNode, endNode, container = startNode.parentElement) {
    super({
      startContainer: container,
      startOffset: indexOfNode(startNode, container) + 1,
      endContainer: container,
      endOffset: indexOfNode(endNode, container) + 1,
    })
  }

  deleteContents() {
    for (const el of getNodesInRange(this)) el.remove()
  }
}
