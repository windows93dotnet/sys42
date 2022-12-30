import system from "../../../system.js"
import ghostify from "../../../fabric/dom/ghostify.js"
import getRects from "../../../fabric/dom/getRects.js"
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

  place(el, x, y, i) {
    const offset = i * 5
    el.style.translate = `${x + offset}px ${y + offset}px`
  }

  start(x, y, items) {
    getRects([
      ...system.transfer.dropzones.keys(),
      ...document.querySelectorAll("iframe"),
    ]).then((rects) => {
      console.log(rects)
    })

    let i
    for (const item of items) {
      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
        item.ghost.classList.remove("selected")
      }

      document.documentElement.append(item.ghost)

      this.place(item.ghost, x, y, i++)

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
    for (const { ghost } of items) this.place(ghost, x, y, i++)
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
