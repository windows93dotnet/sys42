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
  revertAnimation() {
    return this.config.revertAnimation
  }
  dropAnimation() {
    return this.config.dropAnimation
  }

  start(x, y, items) {
    for (const item of items) {
      this.push(item)

      item.offsetX = x - item.x
      item.offsetY = y - item.y

      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
        item.target.classList.add("hide")
      }

      if (!item.ghost.isConnected) {
        document.documentElement.append(item.ghost)
      }

      if (this.config.startAnimation && items.length > 1) {
        animateFrom(item.ghost, {
          translate: `${item.x}px ${item.y}px`,
          ...this.startAnimation(item),
        })
      }
    }

    this.drag(x, y)
  }

  drag(x, y) {
    for (let i = 0, l = this.length; i < l; i++) {
      const item = this[i]
      if (i === 0) {
        item.ghost.style.zIndex = this.length
        item.ghost.style.translate = `
          ${x - item.offsetX}px
          ${y - item.offsetY}px`
      } else {
        const offset = i * 3
        const [first] = this
        item.ghost.style.zIndex = this.length - i
        item.ghost.style.translate = `
          ${x - first.offsetX + offset}px
          ${y - first.offsetY + offset}px`
      }
    }
  }

  revert() {
    for (const item of this) {
      if (this.config.revertAnimation) {
        animateTo(item.ghost, {
          translate: `${item.x}px ${item.y}px`,
          ...this.revertAnimation(item),
        }).then(() => {
          item.target.classList.remove("hide")
          item.ghost.remove()
        })
      } else {
        item.target.classList.remove("hide")
        item.ghost.remove()
      }
    }
  }
}

export function stackItemsHint(options) {
  return new StackItemsHint(options)
}

export default stackItemsHint
