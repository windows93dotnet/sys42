import getRects from "../../../fabric/dom/getRects.js"
import { inRect } from "../../../fabric/geometry/point.js"
import Trait from "../../classes/Trait.js"
import Canceller from "../../../fabric/classes/Canceller.js"
import system from "../../../system.js"

function copyElement(item) {
  const copy = item.target.cloneNode(true)
  copy.id += "-copy"
  item.id = copy.id
  return copy
}

const { parseInt, isNaN } = Number

export class DropzoneHint {
  constructor(el, options) {
    this.el = el
    this.rects = []

    this.config = { ...options }
    this.config.orientation ??= this.el.getAttribute("aria-orientation")

    if (!this.config.orientation) {
      this.config.orientation = "horizontal"
      this.config.freeAxis ??= true
    }

    this.styles = getComputedStyle(this.el)
    this.columnGap = parseInt(this.styles.columnGap, 10)
    this.rowGap = parseInt(this.styles.rowGap, 10)
    if (isNaN(this.columnGap)) this.columnGap = 0
    if (isNaN(this.rowGap)) this.rowGap = 0

    const halfColGap = this.columnGap / 2
    const halfRowGap = this.rowGap / 2
    this.gaps = {
      top: -halfRowGap,
      bottom: halfRowGap,
      left: -halfColGap,
      right: halfColGap,
    }
  }

  async scan(items, cb) {
    this.rects.length = 0
    this.scanReady = getRects(this.config.selector, {
      root: this.el,
      intersecting: true,
    }).then((rects) => {
      if (items && cb) {
        for (const rect of rects) {
          if (cb(rect) !== false) this.rects.push(rect)
        }
      } else {
        this.rects.push(...rects)
      }

      return this.rects
    })

    return this.scanReady
  }

  faintItem() {}
  reviveItem() {}

  activate() {
    this.items = system.transfer.items
    this.inOriginalDropzone = this.items.dropzoneId === this.el.id

    this.cancel = new Canceller(this.config.signal)
    this.signal = this.cancel.signal

    if (this.inOriginalDropzone) {
      queueMicrotask(() => {
        if (this.faintItems) this.faintItems()
        else for (const item of this.items) this.faintItem(item)
      })
    }
  }

  async halt() {
    this.cancel()
    this.el.classList.remove("dragover")

    if (this.inOriginalDropzone) {
      if (system.transfer.effect === "move") {
        for (const item of system.transfer.items) {
          if (!item.dropped) item.target.remove()
        }
      }
    }

    if (this.reviveItems) this.reviveItems()
    else for (const item of this.items) this.reviveItem(item)

    this.rects.length = 0
    this.newIndex = undefined
    this.items = undefined
    this.cancel = undefined
    this.signal = undefined
    this.scanReady = undefined
  }

  restoreSelection() {
    const selectable = this.el[Trait.INSTANCES]?.selectable
    if (selectable) {
      selectable.clear()
      if (this.inOriginalDropzone && system.transfer.effect === "copy") return
      for (const item of system.transfer.items) {
        const target = document.querySelector(`#${item.id}`)
        if (target) selectable?.add(target)
      }
    }
  }

  dragover(x, y) {
    if (this.config.findNewIndex === false || !this.items) return
    const [first] = this.items

    x -= first.offsetX - first.width / 2
    y -= first.offsetY - first.height / 2

    const point = { x, y }

    for (let i = 0, l = this.rects.length; i < l; i++) {
      const rect = this.rects[i]
      if (inRect(point, rect, this.gaps)) {
        this.newIndex = rect.index
        break
      } else if (x > rect.right + this.gaps.right && i === l - 1) {
        // this.newIndex = rect.index + 1
        this.newIndex = undefined
      }
    }
  }

  async enter() {
    this.newIndex = undefined
    this.el.classList.add("dragover")
    await (this.scanReady === undefined ? this.scan() : this.scanReady)
  }

  leave() {
    this.el.classList.remove("dragover")
  }

  revert() {
    this.restoreSelection()
  }

  drop() {
    this.el.classList.remove("dragover")
    if (this.reviveItems) this.reviveItems()

    const { effect } = system.transfer
    const { selector, list } = this.config
    const droppeds = list ? [] : document.createDocumentFragment()

    if (this.inOriginalDropzone) {
      const removed = []
      for (const item of this.items) {
        this.reviveItem(item)
        item.dropped = effect === "move"

        let { index } = item
        for (const remIndex of removed) if (index > remIndex) index--
        if (this.newIndex > index) this.newIndex--
        removed.push(index)

        if (list) {
          if (effect === "move") list.splice(index, 1)
          droppeds.push(item.data)
        } else {
          droppeds.append(effect === "move" ? item.target : copyElement(item))
        }
      }
    } else {
      for (const item of this.items) {
        this.reviveItem(item)
        item.dropped = effect === "move"

        if (list) {
          droppeds.push(item.data)
        } else {
          droppeds.append(effect === "move" ? item.target : copyElement(item))
        }
      }
    }

    if (list) {
      list.splice(this.newIndex, 0, ...droppeds)
      this.config.indexChange?.(this.newIndex)
    } else if (this.newIndex === undefined) {
      this.el.append(droppeds)
    } else {
      const indexedElement = this.el.querySelector(
        `${selector}:nth-child(${this.newIndex + 1})`
      )
      this.el.insertBefore(droppeds, indexedElement)
    }

    this.restoreSelection()
  }
}

export default DropzoneHint
