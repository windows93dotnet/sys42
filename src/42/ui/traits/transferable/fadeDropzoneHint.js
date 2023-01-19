import DropzoneHint from "./DropzoneHint.js"

export class FadeDropzoneHint extends DropzoneHint {
  faintItem(item) {
    item.target.classList.add("opacity-half")
  }

  reviveItem(item) {
    item.target.classList.remove("opacity-half")
  }
}

export function fadeDropzoneHint(el, options) {
  return new FadeDropzoneHint(el, options)
}

export default fadeDropzoneHint
