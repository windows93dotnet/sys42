import { animateTo } from "../../../fabric/dom/animate.js"

export class SlideDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.config = { ...options }
  }

  enter() {
    this.el.classList.add("dragover")
  }

  leave() {
    this.el.classList.remove("dragover")
  }

  dragover() {
    // console.log(items)
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

      undones.push(
        animateTo(item.ghost, {
          translate: `${x}px ${y}px`,
          ...items.dropAnimation(item),
        }).then(() => {
          item.ghost.remove()
          item.target.classList.remove("hide")
        })
      )
    }

    await Promise.all(undones)
  }
}

export function slideDropzoneHint(options) {
  return new SlideDropzoneHint(options)
}

export default slideDropzoneHint
