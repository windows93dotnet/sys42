import DropzoneHint from "./DropzoneHint.js"
import create from "../../create.js"

// TODO: make better way to get picto svg
import "../../components/picto.js"
const pictoArrow = create("ui-picto", { value: "down" })
document.documentElement.append(pictoArrow)
await pictoArrow.ready
const arrow = pictoArrow.firstElementChild
pictoArrow.remove()
arrow.classList.add("dropzone__arrow")
arrow.style.position = "fixed"
arrow.style.top = "0"
arrow.style.left = "0"
arrow.style.top = "calc(-0.5 * var(--picto-size))"
arrow.style.left = "calc(-0.5 * var(--picto-size))"

export class ArrowDropzoneHint extends DropzoneHint {
  faintTarget(target) {
    target.classList.add("opacity-half")
  }

  reviveTarget(target) {
    target.classList.remove("opacity-half")
  }

  enter() {
    super.enter()
    arrow.style.rotate = this.isVertical ? "-90deg" : "none"
    this.el.append(arrow)
    arrow.style.translate = `-200vw -200vh`
  }

  halt() {
    super.halt()
    arrow.remove()
  }

  leave() {
    super.leave()
    arrow.remove()
  }

  async drop() {
    await super.drop()
    arrow.remove()
  }

  dragover(x, y) {
    super.dragover(x, y)
    if (this.rects.length === 0) return

    this.config.arrowOffset ??= 2

    if (this.newIndex === undefined) {
      const rect = this.rects.at(-1)
      if (this.isVertical) {
        x = rect.x - this.config.arrowOffset
        y = rect.bottom + this.gaps.bottom
      } else {
        x = rect.right + this.gaps.right
        y = rect.y - this.config.arrowOffset
      }
    } else {
      const rect = this.rects[this.newIndex]
      if (this.isVertical) {
        x = rect.x - this.config.arrowOffset
        y = rect.y + this.gaps.top
      } else {
        x = rect.x + this.gaps.left
        y = rect.y - this.config.arrowOffset
      }
    }

    arrow.style.translate = `${x}px ${y}px`
  }
}

export function arrowDropzoneHint(el, options) {
  return new ArrowDropzoneHint(el, options)
}

export default arrowDropzoneHint
