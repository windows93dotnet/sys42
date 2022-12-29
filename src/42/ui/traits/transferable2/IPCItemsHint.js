import StackItemsHint from "./StackItemsHint.js"
import ghostify from "../../../fabric/dom/ghostify.js"
import ipc from "../../../core/ipc.js"
import sanitize from "../../../fabric/dom/sanitize.js"
import clear from "../../../fabric/type/object/clear.js"

const context = Object.create(null)

ipc
  .on("42_TRANSFER_START", ({ hints, x, y, items }, { iframe }) => {
    context.iframeRect = iframe.getBoundingClientRect()
    const { borderTopWidth, borderLeftWidth } = getComputedStyle(iframe)
    context.iframeRect.x += Number.parseInt(borderLeftWidth, 10)
    context.iframeRect.y += Number.parseInt(borderTopWidth, 10)

    x += context.iframeRect.x
    y += context.iframeRect.y

    context.itemsHint = new StackItemsHint(hints)
    for (const item of items) {
      item.target = sanitize(item.target)
      item.ghost = sanitize(item.ghost)
      item.x += context.iframeRect.x
      item.y += context.iframeRect.y
    }

    context.items = items
    context.itemsHint.start(x, y, items)
    context.itemsHint.drag(x, y, context.items)
  })
  .on("42_TRANSFER_DRAG", ({ x, y }) => {
    x += context.iframeRect.x
    y += context.iframeRect.y
    context.itemsHint?.drag(x, y, context.items)
  })
  .on("42_TRANSFER_STOP", ({ x, y }) => {
    x += context.iframeRect.x
    y += context.iframeRect.y
    context.itemsHint?.stop(x, y, context.items)
    clear(context)
  })

export class IPCItemsHint {
  constructor(options) {
    this.config = { ...options }
  }

  start(x, y, originalItems) {
    const items = []
    const hints = this.config

    for (const item of originalItems) {
      const exported = { ...item }
      delete exported.restore
      const ghost = ghostify(exported.target, { rect: item })
      ghost.classList.remove("selected")
      exported.ghost = ghost.outerHTML
      exported.target = exported.target.outerHTML
      items.push(exported)
    }

    ipc.emit("42_TRANSFER_START", { x, y, hints, items })

    return false
  }

  drag(x, y) {
    ipc.emit("42_TRANSFER_DRAG", { x, y })
  }

  stop(x, y) {
    ipc.emit("42_TRANSFER_STOP", { x, y })
  }
}

export default IPCItemsHint
