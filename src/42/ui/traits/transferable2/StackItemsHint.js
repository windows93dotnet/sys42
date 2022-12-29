import ghostify from "../../../fabric/dom/ghostify.js"
import { animateTo, animateFrom } from "../../../fabric/dom/animate.js"

export class StackItemsHint {
  constructor(options) {
    this.config = { ...options }
  }

  place(el, x, y, i) {
    const offset = i * 5
    el.style.translate = `${x + offset}px ${y + offset}px`
  }

  start(x, y, items) {
    let i
    for (const item of items) {
      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
        item.ghost.classList.remove("selected")
      }

      document.documentElement.append(item.ghost)

      this.place(item.ghost, x, y, i++)

      if (this.config.animateFromSpeed && items.length > 1) {
        animateFrom(
          item.ghost,
          { translate: `${item.x}px ${item.y}px` },
          this.config.animateFromSpeed
        )
      }
    }
  }

  drag(x, y, items) {
    let i = 0
    for (const { ghost } of items) this.place(ghost, x, y, i++)
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
