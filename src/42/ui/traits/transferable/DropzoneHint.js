import getRects from "../../../fabric/dom/getRects.js"
import Canceller from "../../../fabric/classes/Canceller.js"

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

  mount() {
    this.firstEnterDone = false
    this.cancel = new Canceller(this.config.signal)
    this.signal = this.cancel.signal
  }

  unmount() {
    this.cancel()
    this.el.classList.remove("dragover")
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
  }

  revert() {}
}

export default DropzoneHint
