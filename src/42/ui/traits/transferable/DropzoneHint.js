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

  weakenItems() {}
  restoreItems() {}

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
    if (this.inOriginalDropzone) this.weakenItems()
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

    if (this.inOriginalDropzone) await this.restoreItems()
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

    const { selector } = this.config
    console.log(selector)
  }

  revert() {}
}

export default DropzoneHint
