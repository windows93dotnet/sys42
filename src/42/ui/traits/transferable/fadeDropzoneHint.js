export class FadeDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.config = { ...options }
  }

  enter(items) {
    this.el.classList.add("dragover")
    for (const item of items) {
      item.target.classList.add("opacity-half")
    }
  }

  leave() {
    this.el.classList.remove("dragover")
  }

  dragover() {}

  drop(items) {
    this.el.classList.remove("dragover")
    for (const item of items) {
      item.ghost.remove()
      item.target.classList.remove("opacity-half")
    }
  }
}

export function fadeDropzoneHint(options) {
  return new FadeDropzoneHint(options)
}

export default fadeDropzoneHint
