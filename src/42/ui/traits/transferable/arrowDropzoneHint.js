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
arrow.style.top = "-10px"
arrow.style.left = "-8px"

export class ArrowDropzoneHint extends DropzoneHint {
  faintItem(item) {
    item.target.classList.add("opacity-half")
  }

  reviveItem(item) {
    item.target.classList.remove("opacity-half")
  }

  enter() {
    super.enter()
    this.el.append(arrow)
  }

  leave() {
    super.leave()
    arrow.remove()
  }

  drop() {
    super.drop()
    arrow.remove()
  }

  dragover(x, y) {
    super.dragover(x, y)
    if (this.rects.length === 0) return

    if (this.newIndex === undefined) {
      const rect = this.rects.at(-1)
      x = rect.right + this.columnGap / 2
      y = rect.y
    } else {
      const rect = this.rects[this.newIndex]
      x = rect.x - this.columnGap / 2
      y = rect.y
    }

    arrow.style.translate = `${x}px ${y}px`
  }
}

export function arrowDropzoneHint(el, options) {
  return new ArrowDropzoneHint(el, options)
}

export default arrowDropzoneHint
