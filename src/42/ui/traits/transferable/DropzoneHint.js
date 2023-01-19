// import inIframe from "../../../core/env/realm/inIframe.js"
import getRects from "../../../fabric/dom/getRects.js"
import Canceller from "../../../fabric/classes/Canceller.js"
import system from "../../../system.js"

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

  mount() {
    this.items = system.transfer.items
    this.inOriginalDropzone = this.items.dropzoneId === this.el.id

    // console.log(
    //   inIframe ? "🪟" : "🌐",
    //   "mount",
    //   this.el.id,
    //   this.inOriginalDropzone,
    //   this.items
    // )

    this.cancel = new Canceller(this.config.signal)
    this.signal = this.cancel.signal
    if (this.inOriginalDropzone) {
      if (this.weakenItems) this.weakenItems()
      else for (const item of this.items) this.weakenItem(item)
    }
  }

  async unmount() {
    this.cancel()
    this.el.classList.remove("dragover")

    // console.log(
    //   inIframe ? "🪟" : "🌐",
    //   "unmount",
    //   this.el.id,
    //   this.inOriginalDropzone,
    //   this.items
    // )

    if (this.inOriginalDropzone) {
      if (this.restoreItems) this.restoreItems()
      else for (const item of this.items) this.restoreItem(item)
    }

    this.items = undefined
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
        let { index } = item
        for (const remIndex of removed) if (index > remIndex) index--
        if (this.newIndex > index) this.newIndex--
        removed.push(index)

        if (list) {
          if (effect === "move") list.splice(index, 1)
          droppeds?.push(item.data)
        } else {
          droppeds.append(
            effect === "move" ? item.target : item.target.cloneNode(true)
          )
        }
      }
    } else {
      for (const item of this.items) {
        this.restoreItem(item)
        if (list) {
          droppeds?.push(item.data)
        } else {
          droppeds.append(
            effect === "move" ? item.target : item.target.cloneNode(true)
          )
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
  }

  revert() {}
}

export default DropzoneHint
