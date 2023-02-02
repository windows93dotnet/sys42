// @read https://github.com/tc39/proposal-resizablearraybuffer
// @read https://chromestatus.com/feature/4668361878274048

const isLittleEndianMachine =
  new Uint8Array(new Uint16Array([1]).buffer)[0] === 1

export default class BinaryData {
  #view
  #arr
  #length

  static isLittleEndianMachine = isLittleEndianMachine

  static of(value) {
    const buffer = new BinaryData()
    buffer.write(value)
    return buffer
  }

  constructor(options) {
    this.encoding = options?.encoding ?? "utf8"
    this.memory = new WebAssembly.Memory({ initial: 1 })
    this.#arr = new Uint8Array(this.memory.buffer)
    this.#length = 0
    this.offset = 0
  }

  get byteLength() {
    return this.#length
  }
  get length() {
    return this.#length
  }
  set length(n) {
    this.#length = n
    if (n > this.memory.buffer.byteLength) {
      const remain = n - this.memory.buffer.byteLength
      this.memory.grow(Math.ceil(remain / 0x01_00_00))
      this.#arr = new Uint8Array(this.memory.buffer)
      this.#view = undefined
    }
  }

  get buffer() {
    return this.memory.buffer
  }
  get view() {
    this.#view ??= new DataView(this.memory.buffer)
    return this.#view
  }
  get value() {
    return this.memory.buffer.slice(0, this.#length)
  }

  go(offset = 0) {
    this.offset = offset
  }

  toArrayBuffer(start = 0, end = this.length) {
    return this.memory.buffer.slice(start, end)
  }

  at(n) {
    return n < 0 ? this.#arr.at(this.#length + n) : this.#arr.at(n)
  }

  indexOf(value) {
    return this.#arr.indexOf(value)
  }

  fill(value, start = 0, end = this.length) {
    return this.#arr.fill(value, start, end)
  }

  write(value, offset = this.#length) {
    if (typeof value === "string") value = new TextEncoder().encode(value)
    const len = offset + value.byteLength
    if (len > this.#length) this.length = len
    this.#arr.set(new Uint8Array(value), offset)
  }

  read(length, offset = this.offset, encoding = this.encoding) {
    const end = length === undefined ? this.length : offset + length
    const buffer = this.memory.buffer.slice(offset, end)
    this.offset = end
    return encoding ? new TextDecoder(encoding).decode(buffer) : buffer
  }

  peek(length, offset = this.offset, encoding = this.encoding) {
    const end = length === undefined ? this.length : offset + length
    const buffer = this.memory.buffer.slice(offset, end)
    return encoding ? new TextDecoder(encoding).decode(buffer) : buffer
  }

  readByte(offset = this.offset) {
    this.offset = offset + 1
    return this.#arr[offset]
  }

  writeByte(value, offset = this.length) {
    const len = offset + 1
    if (len > this.length) this.length = len
    this.#arr[offset] = value
    return 1
  }

  readBytesArray(length, offset = this.offset) {
    const arr = new Uint8Array(
      this.memory.buffer.slice(offset, offset + length)
    )
    this.offset = arr.byteLength
    return arr
  }

  peekBytesArray(length, offset = this.offset) {
    return new Uint8Array(this.memory.buffer.slice(offset, offset + length))
  }

  toBytesArray(start = 0, end = this.length) {
    return new Uint8Array(this.memory.buffer.slice(start, end))
  }
}

const p = BinaryData.prototype

p.readUint8 = p.readByte
p.writeUint8 = p.writeByte
p.readUint8Array = p.readBytesArray
p.peekUint8Array = p.peekBytesArray
p.toUint8Array = p.toBytesArray

for (const getKey of Reflect.ownKeys(DataView.prototype)) {
  if (
    typeof getKey === "string" &&
    getKey.startsWith("get") &&
    getKey !== "getUint8"
  ) {
    const key = getKey.slice(3)
    const arrayKey = `${key}Array`
    if (arrayKey in globalThis) {
      const BinaryArray = globalThis[arrayKey]
      const BPE = BinaryArray.BYTES_PER_ELEMENT
      const setKey = `set${key}`

      p[`read${key}`] = function (offset = this.offset, littleEndian) {
        this.offset = offset + BPE
        return this.view[getKey](offset, littleEndian)
      }

      p[`write${key}`] = function (value, offset = this.length, littleEndian) {
        const len = offset + BPE
        if (len > this.length) this.length = len
        this.view[setKey](offset, value, littleEndian)
        return BPE
      }

      p[`to${key}Array`] = function (
        start = 0,
        end = this.length,
        littleEndian
      ) {
        const length = (end - start) / BPE
        const arr = new BinaryArray(length)
        const dataview = this.view
        for (let i = start; i < length; i++) {
          arr[i] = dataview[getKey](i * BPE, littleEndian)
        }

        return arr
      }

      p[`read${key}Array`] = function (
        length,
        offset = this.offset,
        littleEndian
      ) {
        const arr = this[`to${key}Array`](offset, offset + length, littleEndian)
        this.offset = arr.byteLength
        return arr
      }

      p[`peek${key}Array`] = function (
        length,
        offset = this.offset,
        littleEndian
      ) {
        return this[`to${key}Array`](offset, offset + length, littleEndian)
      }
    }
  }
}
