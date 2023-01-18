// import getRects from "../../../fabric/dom/getRects.js"

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
  }

  updateRects() {}
  // async updateRects(items, cb) {
  //   this.rects.length = 0
  //   return getRects(this.config.selector, {
  //     root: this.el,
  //     intersecting: true,
  //   }).then((rects) => {
  //     if (items && cb) {
  //       for (const rect of rects) {
  //         for (const item of items) if (item.target === rect.target) continue
  //         if (cb(rect) !== false) this.rects.push(rect)
  //       }
  //     } else {
  //       this.rects.push(...rects)
  //     }

  //     return this.rects
  //   })
  // }

  init() {}

  cleanup() {}

  enter() {}

  leave() {}

  revert() {}

  dragover() {}

  drop() {}
}

export default DropzoneHint
