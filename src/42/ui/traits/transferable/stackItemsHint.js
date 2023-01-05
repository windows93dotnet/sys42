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
        document.documentElement.append(item.ghost)
      } else if (!item.ghost.isConnected) {
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
    const [first] = this
    if (first) {
      first.ghost.style.zIndex = 1e5 + this.length
      first.ghost.style.translate = `
        ${x - first.offsetX}px
        ${y - first.offsetY}px`

      for (let i = 1, l = this.length; i < l; i++) {
        const item = this[i]
        const offset = i * 3
        item.ghost.style.zIndex = 1e5 + this.length - i
        item.ghost.style.translate = `
          ${x - first.offsetX + offset}px
          ${y - first.offsetY + offset}px`
      }
    }
  }

  async revert() {
    const undones = []
    for (const item of this) {
      if (this.config.revertAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${item.x}px ${item.y}px`,
            ...this.revertAnimation(item),
          }).then(() => {
            item.ghost.remove()
          })
        )
      } else {
        item.ghost.remove()
      }
    }

    await Promise.all(undones)
  }
}

export function stackItemsHint(options) {
  return new StackItemsHint(options)
}

export default stackItemsHint
