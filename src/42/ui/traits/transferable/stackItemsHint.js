import system from "../../../system.js"
import inIframe from "../../../core/env/realm/inIframe.js"
import uid from "../../../core/uid.js"
import ghostify from "../../../fabric/dom/ghostify.js"
import getRects from "../../../fabric/dom/getRects.js"
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
      item.id = item.target.id

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

  async adopt(x, y) {
    const currentZoneHint = system.transfer.currentZone?.hint
    if (
      !currentZoneHint ||
      currentZoneHint.isIframe ||
      currentZoneHint.newIndex === undefined
    ) {
      for (const item of system.transfer.items) item.ghost.remove()
      return
    }

    if (inIframe) {
      for (const item of this) {
        item.ghost.classList.remove("hide")
        if (!item.ghost.isConnected) {
          item.ghost.style.top = 0
          item.ghost.style.left = 0
          document.documentElement.append(item.ghost)
        }
      }

      this.drag(x, y)
    }

    const { newIndex } = currentZoneHint
    const { selector } = currentZoneHint.config

    const undones = []
    const start = newIndex + 1
    const end = newIndex + this.length

    const droppeds = document.querySelectorAll(
      `${selector}:nth-child(n+${start}):nth-child(-n+${end})`
    )

    for (let i = 0, l = droppeds.length; i < l; i++) {
      droppeds[i].classList.add("invisible")
      // droppeds[i].id ||= uid()
      // this[i].target = droppeds[i]
    }

    const rects = await getRects(droppeds, {
      root: this.el,
      intersecting: true,
    })

    for (let i = 0, l = this.length; i < l; i++) {
      const item = this[i]
      if (rects[i] && this.config.dropAnimation) {
        undones.push(
          animateTo(item.ghost, {
            translate: `${rects[i].x}px ${rects[i].y}px`,
            ...this.dropAnimation(item),
          }).then(() => {
            item.ghost.remove()
            rects[i].target.classList.remove("invisible")
          })
        )
      } else {
        item.ghost.remove()
        item.target.classList.remove("invisible")
      }
    }

    await Promise.all(undones)
  }
}

export function stackItemsHint(options) {
  return new StackItemsHint(options)
}

export default stackItemsHint
