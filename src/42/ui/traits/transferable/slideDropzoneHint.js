import { animateTo } from "../../../fabric/dom/animate.js"
import getRects from "../../../fabric/dom/getRects.js"
import appendStyle from "../../../fabric/dom/appendStyle.js"

export class SlideDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.config = { ...options }
    this.rects = []
  }

  enter(items) {
    this.el.classList.add("dragover")

    // for (const item of items) item.target.classList.remove("hide")

    // this.styles = {
    //   enter: appendStyle(`${this.config.selector} {opacity: 0.5}`),
    // }

    // requestAnimationFrame(() => {
    getRects(this.config.selector, this.el).then((rects) => {
      // for (const item of items) item.target.classList.add("hide")

      // console.log(items.length, rects.length)
      // for (const item of items) {
      //   console.log(item.target.className)
      // }

      // console.table(rects)

      this.rects.push(...rects)
    })
    // })
  }

  leave() {
    this.el.classList.remove("dragover")
    this.rects.length = 0
    this.styles?.enter.destroy()
  }

  dragover(/* [first] */) {
    // if (first) {
    //   console.log(this.el.contains(first.target))
    // }
  }

  async drop(items) {
    // this.el.classList.remove("dragover")
    this.leave()

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
