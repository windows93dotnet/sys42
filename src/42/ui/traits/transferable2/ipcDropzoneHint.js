export class IPCDropzoneHint {
  constructor(options) {
    this.config = { ...options }
  }

  enter() {
    console.log("ipc enter")
  }

  leave() {
    console.log("ipc leave")
  }

  dragover() {
    console.log("ipc dragover")
  }

  drop() {
    console.log("ipc drop")
  }
}

export function ipcDropzoneHint(options) {
  return new IPCDropzoneHint(options)
}

export default ipcDropzoneHint
