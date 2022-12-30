export class SlideDropzoneHint {
  constructor(el, options) {
    this.el = el
    this.config = { ...options }
  }

  enter() {
    this.el.classList.add("dragover")
  }

  leave() {
    this.el.classList.remove("dragover")
  }

  dragover() {
    console.log("dragover")
  }

  drop() {
    console.log("drop")
  }
}

export function slideDropzoneHint(options) {
  return new SlideDropzoneHint(options)
}

export default slideDropzoneHint
