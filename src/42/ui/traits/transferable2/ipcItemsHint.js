import system from "../../../system.js"
import ghostify from "../../../fabric/dom/ghostify.js"
import ipc from "../../../core/ipc.js"
import sanitize from "../../../fabric/dom/sanitize.js"
import clear from "../../../fabric/type/object/clear.js"

const context = Object.create(null)

ipc
  .on("42_TRANSFER_START", async ({ hints, x, y, items }, { iframe }) => {
    context.iframeRect = iframe.getBoundingClientRect()
    const { borderTopWidth, borderLeftWidth } = getComputedStyle(iframe)
    context.iframeRect.x += Number.parseInt(borderLeftWidth, 10)
    context.iframeRect.y += Number.parseInt(borderTopWidth, 10)

    x += context.iframeRect.x
    y += context.iframeRect.y

    context.hints = await system.transfer.makeHints(hints)
    system.transfer.items = context.hints.items
    system.transfer.items.push(...items)

    system.transfer.findTransferZones(x, y)

    for (const item of items) {
      item.target = sanitize(item.target)
      item.ghost = sanitize(item.ghost)
      item.x += context.iframeRect.x
      item.y += context.iframeRect.y
    }

    system.transfer.items.start(x, y, items)
    system.transfer.items.drag(x, y)
  })
  .on("42_TRANSFER_DRAG", ({ x, y }) => {
    x += context.iframeRect.x
    y += context.iframeRect.y
    system.transfer.setCurrentZone(x, y)
    system.transfer.items.drag?.(x, y)
  })
  .on("42_TRANSFER_REVERT", ({ x, y }) => {
    x += context.iframeRect.x
    y += context.iframeRect.y
    context.hints?.items?.revert(x, y)
    clear(context)
  })

export class IPCItemsHint extends Array {
  constructor(options) {
    super()
    this.config = { ...options }
  }

  start(x, y, items) {
    const hints = { items: this.config }

    for (const item of items) {
      const ghost = ghostify(item.target, { rect: item })
      item.ghost = ghost.outerHTML
      item.target = item.target.outerHTML
    }

    ipc.emit("42_TRANSFER_START", { x, y, hints, items })
  }

  drag(x, y) {
    ipc.emit("42_TRANSFER_DRAG", { x, y })
  }

  revert(x, y) {
    ipc.emit("42_TRANSFER_REVERT", { x, y })
  }
}

export function ipcItemsHint(options) {
  return new IPCItemsHint(options)
}

export default ipcItemsHint
