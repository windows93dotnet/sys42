import ghostify from "../../../fabric/dom/ghostify.js"
import { animateTo, animateFrom } from "../../../fabric/dom/animate.js"

export class StackItemsHint extends Array {
  constructor(options) {
    super()
    this.config = { ...options }
  }

  startAnimation() {
    return this.config.startAnimation
  }
  stopAnimation() {
    return this.config.stopAnimation
  }

  place(item, x, y, i) {
    if (i === 0) {
      item.ghost.style.zIndex = this.length
      item.ghost.style.translate = `
      ${x - item.offsetX}px
      ${y - item.offsetY}px`
    } else {
      const offset = i * 5
      const [first] = this
      item.ghost.style.zIndex = this.length - i
      item.ghost.style.translate = `
        ${x - first.offsetX + offset}px
        ${y - first.offsetY + offset}px`
    }
  }

  start(x, y) {
    let i
    for (const item of this) {
      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
        item.ghost.classList.remove("selected")
      }

      document.documentElement.append(item.ghost)

      this.place(item, x, y, i++)

      if (this.config.startAnimation && this.length > 1) {
        animateFrom(item.ghost, {
          translate: `${item.x}px ${item.y}px`,
          ...this.startAnimation(item),
        })
      }
    }
  }

  drag(x, y) {
    let i = 0
    for (const item of this) this.place(item, x, y, i++, this)
  }

  stop() {
    for (const item of this) {
      if (this.config.stopAnimation) {
        animateTo(item.ghost, {
          translate: `${item.x}px ${item.y}px`,
          ...this.stopAnimation(item),
        }).then(() => item.ghost.remove())
      } else item.ghost.remove()
    }
  }
}

export function stackItemsHint(options) {
  return new StackItemsHint(options)
}

export default stackItemsHint
