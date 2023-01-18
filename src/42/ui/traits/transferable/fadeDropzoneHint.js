import DropzoneHint from "./DropzoneHint.js"

export class FadeDropzoneHint extends DropzoneHint {
  enter(items) {
    super.enter()
    for (const item of items) {
      item.target.classList.add("opacity-half")
    }
  }

  async unmount(items) {
    super.unmount()
    for (const item of items) {
      item.target.classList.remove("opacity-half")
    }
  }

  drop(items) {
    super.drop()
    for (const item of items) {
      item.ghost.remove()
    }
  }
}

export function fadeDropzoneHint(options) {
  return new FadeDropzoneHint(options)
}

export default fadeDropzoneHint
