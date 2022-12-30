/* eslint-disable max-params */
import ghostify from "../../../fabric/dom/ghostify.js"
import { animateTo, animateFrom } from "../../../fabric/dom/animate.js"

export class StackItemsHint {
  constructor(options) {
    this.config = { ...options }
  }

  startAnimation() {
    return this.config.startAnimation
  }
  stopAnimation() {
    return this.config.stopAnimation
  }

  place(item, x, y, i, items) {
    if (i === 0) {
      item.ghost.style.zIndex = items.length
      item.ghost.style.translate = `
      ${x - item.offsetX}px
      ${y - item.offsetY}px`
    } else {
      const offset = i * 5
      const [first] = items
      item.ghost.style.zIndex = items.length - i
      item.ghost.style.translate = `
        ${x - first.offsetX + offset}px
        ${y - first.offsetY + offset}px`
    }
  }

  start(x, y, items) {
    let i
    for (const item of items) {
      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
        item.ghost.classList.remove("selected")
      }

      document.documentElement.append(item.ghost)

      this.place(item, x, y, i++, items)

      if (this.config.startAnimation && items.length > 1) {
        animateFrom(item.ghost, {
          translate: `${item.x}px ${item.y}px`,
          ...this.startAnimation(item),
        })
      }
    }
  }

  drag(x, y, items) {
    let i = 0
    for (const item of items) this.place(item, x, y, i++, items)
  }

  stop(x, y, items) {
    for (const item of items) {
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
