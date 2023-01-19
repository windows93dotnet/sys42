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
        this.scanReady = getRects(this.config.selector, {
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

        return this.scanReady
      }
    }
  }

  scan() {}
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

  dragover() {}

  async enter() {
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
