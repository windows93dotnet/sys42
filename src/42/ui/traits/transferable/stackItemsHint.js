import system from "../../../system.js"
import ItemsHint from "./ItemsHint.js"

export class StackItemsHint extends ItemsHint {
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
}

export function stackItemsHint(options) {
  return new StackItemsHint(options)
}

export default stackItemsHint
