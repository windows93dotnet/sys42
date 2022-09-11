// @read https://github.com/tc39/proposal-resizablearraybuffer
// @read https://chromestatus.com/feature/4668361878274048

export default class Buffer {
  #memory
  #view
  #arr
  #length

  constructor() {
    this.#memory = new WebAssembly.Memory({ initial: 1 })
    this.#arr = new Uint8Array(this.#memory.buffer)
    this.#length = 0
    this.offset = 0
  }

  get length() {
    return this.#length
  }
  set length(n) {
    if (n > this.#length) this.#length = n
    if (n > this.#memory.buffer.byteLength) {
      const remain = n - this.#memory.buffer.byteLength
      this.#memory.grow(Math.ceil(remain / 0x01_00_00))
      this.#arr = new Uint8Array(this.#memory.buffer)
      this.#view = undefined
    }
  }
  get buffer() {
    return this.#memory.buffer
  }
  get value() {
    return this.#memory.buffer.slice(0, this.#length)
  }
  get view() {
    this.#view ??= new DataView(this.#memory.buffer)
    return this.#view
  }

  at(n) {
    return n < 0 ? this.#arr.at(this.#length + n) : this.#arr.at(n)
  }

  write(chunk, offset = this.#length) {
    if (typeof chunk === "string") chunk = new TextEncoder().encode(chunk)
    this.length = offset + chunk.byteLength
    this.#arr.set(chunk, offset)
  }

  read(length, offset = this.offset, encoding = "utf8") {
    const end = length === undefined ? this.length : offset + length
    const buffer = this.#memory.buffer.slice(offset, end)
    this.offset = end
    return encoding ? new TextDecoder(encoding).decode(buffer) : buffer
  }
}

const p = Buffer.prototype

for (const getKey of Reflect.ownKeys(DataView.prototype)) {
  if (typeof getKey === "string" && getKey.startsWith("get")) {
    const key = getKey.slice(3)
    const BPE = globalThis[`${key}Array`].BYTES_PER_ELEMENT
    const setKey = `set${key}`

    p[`read${key}`] = function (offset = this.offset) {
      this.offset = offset + BPE
      return this.view[getKey](offset)
    }

    p[`write${key}`] = function (value, offset = this.length, littleEndian) {
      this.length = offset + BPE
      this.view[setKey](offset, value, littleEndian)
      return BPE
    }
  }
}
