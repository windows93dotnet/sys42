import DropzoneHint from "./DropzoneHint.js"

export class FadeDropzoneHint extends DropzoneHint {
  weakenItems() {
    for (const item of this.items) {
      item.target.classList.add("opacity-half")
    }
  }

  restoreItems() {
    for (const item of this.items) {
      item.target.classList.remove("opacity-half")
    }
  }

  drop() {
    super.drop()
    for (const item of this.items) item.ghost.remove()
  }
}

export function fadeDropzoneHint(el, options) {
  return new FadeDropzoneHint(el, options)
}

export default fadeDropzoneHint
