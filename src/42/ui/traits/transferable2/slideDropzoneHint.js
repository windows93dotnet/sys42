export class SlideDropzoneHint {
  constructor(options) {
    this.config = { ...options }
  }

  enter() {
    console.log("enter")
  }

  leave() {
    console.log("leave")
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
