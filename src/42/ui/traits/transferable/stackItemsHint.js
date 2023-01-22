import ItemsHint from "./ItemsHint.js"

export class StackItemsHint extends ItemsHint {
  drag({ x, y }) {
    super.drag()
    if (!this.length) return
    const [first] = this
    first.ghost.style.zIndex = 1e5 + this.length

    first.ghost.style.translate = `${x}px ${y}px`

    for (let i = 1, l = this.length; i < l; i++) {
      const item = this[i]
      const offset = i * 3
      item.ghost.style.zIndex = 1e5 + this.length - i
      item.ghost.style.translate = `
        ${x + offset}px
        ${y + offset}px`
    }
  }
}

export function stackItemsHint(options) {
  return new StackItemsHint(options)
}

export default stackItemsHint
