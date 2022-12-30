export class SlideDropzoneHint {
  constructor(options) {
    this.config = { ...options }
  }

  start() {
    console.log(111)
  }

  drag() {
    console.log(112)
  }

  stop() {
    console.log(113)
  }
}

export function slideDropzoneHint(options) {
  return new SlideDropzoneHint(options)
}

export default slideDropzoneHint
