import DropzoneHint from "./DropzoneHint.js"

export class FadeDropzoneHint extends DropzoneHint {
  faintTarget(target) {
    target.classList.add("opacity-half")
  }

  reviveTarget(target) {
    target.classList.remove("opacity-half")
  }
}

export function fadeDropzoneHint(el, options) {
  return new FadeDropzoneHint(el, options)
}

export default fadeDropzoneHint
