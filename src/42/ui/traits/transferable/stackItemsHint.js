import system from "../../../system.js"
import uid from "../../../core/uid.js"
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
    this.length = 0
    for (const item of items) {
      this.push(item)

      item.offsetX ??= x - item.x
      item.offsetY ??= y - item.y

      item.target.id ||= uid()

      if (!item.ghost) {
        item.ghost = ghostify(item.target, { rect: item })
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

      let translate

      if (
        system.transfer.currentZone &&
        system.transfer.currentZone.hint.inOriginalDropzone &&
        system.transfer.currentZone.hint.config.freeAxis !== true
      ) {
        translate =
          system.transfer.currentZone.hint.config.orientation === "vertical"
            ? { x: first.x, y: y - first.offsetY }
            : { x: x - first.offsetX, y: first.y }
      } else {
        translate = { x: x - first.offsetX, y: y - first.offsetY }
      }

      first.ghost.style.translate = `${translate.x}px ${translate.y}px`

      for (let i = 1, l = this.length; i < l; i++) {
        const item = this[i]
        const offset = i * 3
        item.ghost.style.zIndex = 1e5 + this.length - i
        item.ghost.style.translate = `
          ${translate.x + offset}px
          ${translate.y + offset}px`
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
