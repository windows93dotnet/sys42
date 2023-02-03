import DropzoneHint from "./DropzoneHint.js"

export class DimDropzoneHint extends DropzoneHint {
  faintTarget(target) {
    target.classList.add("opacity-half")
  }

  reviveTarget(target) {
    target.classList.remove("opacity-half")
  }
}

export function dimDropzoneHint(el, options) {
  return new DimDropzoneHint(el, options)
}

export default dimDropzoneHint
