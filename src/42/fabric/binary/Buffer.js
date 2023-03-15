// @read https://github.com/tc39/proposal-resizablearraybuffer
// @read https://chromestatus.com/feature/4668361878274048
// @read https://deno.land/std@0.179.0/streams/buffer.ts?source

const isLittleEndianMachine =
  new Uint8Array(new Uint16Array([1]).buffer)[0] === 1

export default class Buffer {
  #arr
  #length

  static isLittleEndianMachine = isLittleEndianMachine

  static of(value) {
    const buffer = new Buffer()
    buffer.write(value)
    return buffer
  }

  constructor(options) {
    this.memory = new WebAssembly.Memory({ initial: 1 })
    this.#arr = new Uint8Array(this.memory.buffer)
    this.#length = 0
    this.offset = 0

    this.encoding = options?.encoding ?? "utf8"
    if (options?.fatal !== undefined) {
      this.decoderOptions ??= {}
      this.decoderOptions.fatal = options?.fatal
    }

    if (options?.ignoreBOM !== undefined) {
      this.decoderOptions ??= {}
      this.decoderOptions.ignoreBOM = options?.ignoreBOM
    }
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

  #view
  get view() {
    this.#view ??= new DataView(this.memory.buffer)
    return this.#view
  }
  get buffer() {
    return this.memory.buffer
  }
  get value() {
    return this.memory.buffer.slice(0, this.#length)
  }

  go(offset = 0) {
    this.offset = offset
    return this
  }

  toArrayBuffer(start = 0, end = this.length) {
    return this.memory.buffer.slice(start, end)
  }

  at(n) {
    const abs = Math.abs(n)
    if (abs >= this.#length) return
    return n < 0 ? this.#arr.at(this.#length + n) : this.#arr.at(n)
  }
  indexOf(value) {
    return this.#arr.indexOf(value)
  }
  fill(value, start = 0, end = this.length) {
    return this.#arr.fill(value, start, end)
  }
  subarray(start = 0, end = this.length) {
    return this.#arr.subarray(start, end)
  }
  slice(start = 0, end = this.length) {
    return new Uint8Array(this.memory.buffer.slice(start, end))
  }

  // byte
  // ----
  writeByte(value, offset = this.length) {
    const len = offset + 1
    if (len > this.length) this.length = len
    this.#arr[offset] = value
    return 1
  }
  readByte(offset = this.offset) {
    this.offset = offset + 1
    return this.#arr[offset]
  }
  peekByte(offset = this.offset) {
    return this.#arr[offset]
  }

  // bytes
  // -----
  write(value, offset = this.#length) {
    const len = offset + value.byteLength
    if (len > this.#length) this.length = len
    this.#arr.set(new Uint8Array(value), offset)
  }
  read(length, offset = this.offset) {
    const arr = this.#arr.subarray(offset, offset + length)
    this.offset = offset + arr.byteLength
    return arr
  }
  peek(length, offset = this.offset) {
    return this.#arr.subarray(offset, offset + length)
  }

  // string
  // ------
  #encoder
  get encoder() {
    this.#encoder ??= new TextEncoder()
    return this.#encoder
  }

  #decoder
  get decoder() {
    this.#decoder ??= new TextDecoder(this.encoding, this.decoderOptions)
    return this.#decoder
  }

  writeText(string, offset = this.#length) {
    const arr = this.encoder.encode(string)
    const len = offset + arr.byteLength
    if (len > this.#length) this.length = len
    this.#arr.set(arr, offset)
  }
  readText(length, offset = this.offset, encoding) {
    const end = length === undefined ? this.length : offset + length
    const arr = this.#arr.subarray(offset, end)
    if (end !== this.offset + 1) this.#decoder = undefined // reset decoder stream position
    this.offset = end
    const decoder = encoding ? new TextDecoder(encoding) : this.decoder
    return decoder.decode(arr, { stream: true })
  }
  peekText(length, offset = this.offset, encoding) {
    const end = length === undefined ? this.length : offset + length
    const arr = this.#arr.subarray(offset, end)
    const decoder = encoding ? new TextDecoder(encoding) : this.decoder
    return decoder.decode(arr)
  }
}

const p = Buffer.prototype

p.writeUint8 = p.writeByte
p.readUint8 = p.readByte
p.peekUint8 = p.peekByte

p.writeUint8Array = p.write
p.readUint8Array = p.read
p.peekUint8Array = p.peek

p.toUint8Array = p.slice

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

      p[`write${key}`] = function (value, offset = this.length, littleEndian) {
        const len = offset + BPE
        if (len > this.length) this.length = len
        this.view[setKey](offset, value, littleEndian)
        return BPE
      }

      p[`read${key}`] = function (offset = this.offset, littleEndian) {
        this.offset = offset + BPE
        return this.view[getKey](offset, littleEndian)
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
    }
  }
}
