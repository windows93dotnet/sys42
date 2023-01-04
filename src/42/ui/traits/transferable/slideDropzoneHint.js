import { animateTo } from "../../../fabric/dom/animate.js"
import getRects from "../../../fabric/dom/getRects.js"

export class SlideDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.config = { ...options }
    this.rects = []
  }

  enter() {
    this.el.classList.add("dragover")
    getRects(this.config.selector, this.el).then((rects) => {
      this.rects.push(...rects)
    })
  }

  leave() {
    this.el.classList.remove("dragover")
    this.rects.length = 0
  }

  dragover(/* [first] */) {
    // if (first) {
    //   console.log(this.el.contains(first.target))
    // }
  }

  async drop(items) {
    this.el.classList.remove("dragover")

    const undones = []

    for (const item of items) {
      // if (!this.el.contains(item.target)) this.el.append(item.target)
      this.el.append(item.target)

      item.target.classList.remove("hide")
      const { x, y } = item.target.getBoundingClientRect()
      item.target.classList.add("hide")

      if (items.config.dropAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${x}px ${y}px`,
            ...items.dropAnimation(item),
          }).then(() => {
            item.ghost.remove()
            item.target.classList.remove("hide")
          })
        )
      } else {
        item.ghost.remove()
        item.target.classList.remove("hide")
      }
    }

    await Promise.all(undones)
  }
}

export function slideDropzoneHint(el, options) {
  return new SlideDropzoneHint(el, options)
}

export default slideDropzoneHint
