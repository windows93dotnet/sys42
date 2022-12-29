import ghostify from "../../../fabric/dom/ghostify.js"
import { animateTo, animateFrom } from "../../../fabric/dom/animate.js"

export class StackItemsHint {
  constructor(options) {
    this.config = { ...options }
  }

  start(x, y, items) {
    for (const item of items) {
      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
        item.ghost.classList.remove("selected")
      }

      document.documentElement.append(item.ghost)
      item.ghost.style.translate = `${x}px ${y}px`

      if (items.length > 1) {
        animateFrom(
          item.ghost,
          { translate: `${item.x}px ${item.y}px` },
          this.config.animateFromSpeed
        )
      }
    }
  }

  move(x, y, items) {
    for (const { ghost } of items) {
      ghost.style.translate = `${x}px ${y}px`
    }
  }

  stop(x, y, items) {
    for (const { x, y, ghost } of items) {
      if (this.config.animateToSpeed) {
        animateTo(
          ghost,
          { translate: `${x}px ${y}px` },
          this.config.animateToSpeed
        ).then(() => ghost.remove())
      } else ghost.remove()
    }
  }
}

export default StackItemsHint
