import DropzoneHint from "./DropzoneHint.js"

export class FadeDropzoneHint extends DropzoneHint {
  weakenItem(item) {
    item.target.classList.add("opacity-half")
  }

  restoreItem(item) {
    item.target.classList.remove("opacity-half")
  }
}

export function fadeDropzoneHint(el, options) {
  return new FadeDropzoneHint(el, options)
}

export default fadeDropzoneHint
