const dataViewKeys = []

for (const key of Reflect.ownKeys(DataView.prototype)) {
  if (typeof key !== "string") continue
  if (key.startsWith("get") || key.startsWith("set")) {
    dataViewKeys.push(key)
  }
}

export default class Buffer extends Uint8Array {
  #memory
  #view
  #length

  constructor() {
    const memory = new WebAssembly.Memory({ initial: 1 })
    super(memory.buffer)
    this.#memory = memory
    this.#view = new Uint8Array(this.#memory.buffer)
    this.#length = 0
  }

  get length() {
    return this.#length
  }
  get byteLength() {
    return this.#length
  }
  get value() {
    return this.#view.slice(0, this.#length).buffer
  }

  write(chunk, offset = this.#length) {
    if (typeof chunk === "string") chunk = new TextEncoder().encode(chunk)

    if (offset + chunk.byteLength > this.#memory.buffer.byteLength) {
      this.#memory.grow(Math.ceil(chunk.byteLength / 0x01_00_00))
      this.#view = new Uint8Array(this.#memory.buffer)
    }

    this.#view.set(chunk, offset)
    this.#length += chunk.byteLength
  }
}
