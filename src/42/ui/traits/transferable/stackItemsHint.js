import ItemsHint from "./ItemsHint.js"

export class StackItemsHint extends ItemsHint {
  drag(x, y) {
    super.drag(x, y)
    if (!this.length) return
    const [first] = this
    first.ghost.style.zIndex = 1e5 + this.length

    let translate

    if (
      this.currentZone?.isOriginalDropzone &&
      this.currentZone?.freeAxis !== true
    ) {
      translate = this.currentZone.isVertical
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

export function stackItemsHint(options) {
  return new StackItemsHint(options)
}

export default stackItemsHint
