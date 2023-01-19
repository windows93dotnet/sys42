import getRects from "../../../fabric/dom/getRects.js"
import Trait from "../../classes/Trait.js"
import Canceller from "../../../fabric/classes/Canceller.js"
import system from "../../../system.js"

function copyElement(item) {
  const copy = item.target.cloneNode(true)
  copy.id += "-copy"
  item.id = copy.id
  return copy
}

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

    if (this.config.scan) {
      this.scan = async (items, cb) => {
        this.rects.length = 0
        return getRects(this.config.selector, {
          root: this.el,
          intersecting: true,
        }).then((rects) => {
          if (items && cb) {
            for (const rect of rects) {
              for (const item of items) {
                if (item.target === rect.target) continue
              }

              if (cb(rect) !== false) this.rects.push(rect)
            }
          } else {
            this.rects.push(...rects)
          }

          return this.rects
        })
      }
    }
  }

  scan() {}

  weakenItem() {}
  restoreItem() {}

  activate() {
    this.items = system.transfer.items
    this.inOriginalDropzone = this.items.dropzoneId === this.el.id

    this.cancel = new Canceller(this.config.signal)
    this.signal = this.cancel.signal
    if (this.inOriginalDropzone) {
      if (this.weakenItems) this.weakenItems()
      else for (const item of this.items) this.weakenItem(item)
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
      } else if (this.restoreItems) this.restoreItems()
      else for (const item of this.items) this.restoreItem(item)
    }

    this.items = undefined
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

  dragover() {}

  enter() {
    this.el.classList.add("dragover")
  }

  leave() {
    this.el.classList.remove("dragover")
  }

  drop() {
    this.el.classList.remove("dragover")
    if (this.restoreItems) this.restoreItems()

    const { effect } = system.transfer
    const { selector, list } = this.config
    const droppeds = list ? [] : document.createDocumentFragment()

    if (this.inOriginalDropzone) {
      const removed = []
      for (const item of this.items) {
        this.restoreItem(item)
        item.dropped = effect === "move"

        let { index } = item
        for (const remIndex of removed) if (index > remIndex) index--
        if (this.newIndex > index) this.newIndex--
        removed.push(index)

        if (list) {
          if (effect === "move") list.splice(index, 1)
          droppeds?.push(item.data)
        } else {
          droppeds.append(effect === "move" ? item.target : copyElement(item))
        }
      }
    } else {
      for (const item of this.items) {
        this.restoreItem(item)
        item.dropped = effect === "move"

        if (list) {
          droppeds?.push(item.data)
        } else {
          droppeds.append(effect === "move" ? item.target : copyElement(item))
        }
      }
    }

    if (list) {
      list.splice(this.newIndex, 0, ...droppeds)
      this.config.indexChange?.(this.newIndex)
    } else if (this.newIndex) {
      const indexedElement = this.el.querySelector(
        `${selector}:nth-child(${this.newIndex + 1})`
      )
      this.el.insertBefore(droppeds, indexedElement)
    } else {
      this.el.append(droppeds)
    }

    this.restoreSelection()
  }

  revert() {
    this.restoreSelection()
  }
}

export default DropzoneHint
