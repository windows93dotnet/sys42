// @read https://github.com/tc39/proposal-resizablearraybuffer
// @read https://chromestatus.com/feature/4668361878274048
// @read https://deno.land/std@0.179.0/streams/buffer.ts?source

import equalsArrayBufferView from "./equalsArrayBufferView.js"

const isLittleEndianMachine =
  new Uint8Array(new Uint16Array([1]).buffer)[0] === 1

// @ts-ignore
const supportResize = ArrayBuffer.prototype.resize !== undefined

const MAX_BYTE_LENGTH = 0xff_ff_ff_fe // 2 ** 32 - 2
const MEMORY_PAGE = 0x01_00_00

export default class Buffer {
  #arr
  #length
  decoderOptions

  static isLittleEndianMachine = isLittleEndianMachine

  static from(value) {
    const buffer = new Buffer()
    if (value == null) return buffer
    if (typeof value === "string") buffer.writeText(value)
    else buffer.write(value)
    return buffer
  }

  static equals(a, b) {
    return equalsArrayBufferView(a, b)
  }

  constructor(options) {
    const length = typeof options === "number" ? options : 0
    this.memory = supportResize
      ? // @ts-ignore
        { buffer: new ArrayBuffer(length, { maxByteLength: MAX_BYTE_LENGTH }) }
      : new WebAssembly.Memory({
          initial: 1 + Math.ceil((length - MEMORY_PAGE) / MEMORY_PAGE),
        })
    this.#arr = new Uint8Array(this.memory.buffer)
    this.#length = length
    this.writeOffset = 0
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
    this.writeOffset = n
    if (n > this.memory.buffer.byteLength) {
      if (supportResize) {
        // @ts-ignore
        this.memory.buffer.resize(n)
      } else {
        const remain = n - this.memory.buffer.byteLength
        // @ts-ignore
        this.memory.grow(Math.ceil(remain / MEMORY_PAGE))
        this.#arr = new Uint8Array(this.memory.buffer)
        this.#view = undefined
      }
    }
  }

  /** @type {DataView | undefined} */
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
  writeByte(value, writeOffset = this.writeOffset) {
    const len = writeOffset + 1
    if (len > this.length) this.length = len
    this.#arr[writeOffset] = value
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
  write(value, writeOffset = this.writeOffset) {
    const len = writeOffset + value.byteLength
    if (len > this.#length) this.length = len
    this.#arr.set(new Uint8Array(value), writeOffset)
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

  writeText(string, writeOffset = this.writeOffset) {
    const arr = this.encoder.encode(string)
    const len = writeOffset + arr.byteLength
    if (len > this.#length) this.length = len
    this.#arr.set(arr, writeOffset)
  }
  readText(length, offset = this.offset, encoding) {
    if (offset >= this.#length) return
    const end =
      length === undefined
        ? this.length
        : Math.min(offset + length, this.length)
    const arr = this.memory.buffer.slice(offset, end)
    if (end < this.offset) this.#decoder = undefined // reset decoder stream position
    this.offset = end
    const decoder = encoding ? new TextDecoder(encoding) : this.decoder
    return decoder.decode(arr, { stream: true })
  }
  peekText(length, offset = this.offset, encoding) {
    if (offset >= this.#length) return
    const end =
      length === undefined
        ? this.length
        : Math.min(offset + length, this.length)
    const arr = this.memory.buffer.slice(offset, end)
    const decoder = encoding ? new TextDecoder(encoding) : this.decoder
    return decoder.decode(arr)
  }

  toString() {
    return this.decoder.decode(this.memory.buffer.slice(0, this.#length))
  }

  [Symbol.iterator]() {
    return this.#arr.subarray(0, this.#length)[Symbol.iterator]()
  }
}

const p = Buffer.prototype

// @ts-ignore
p.writeUint8 = p.writeByte
// @ts-ignore
p.readUint8 = p.readByte
// @ts-ignore
p.peekUint8 = p.peekByte

// @ts-ignore
p.writeUint8Array = p.write
// @ts-ignore
p.readUint8Array = p.read
// @ts-ignore
p.peekUint8Array = p.peek

// @ts-ignore
p.toUint8Array = p.slice

for (const getKey of Reflect.ownKeys(DataView.prototype)) {
  if (
    typeof getKey === "string" &&
    getKey.startsWith("get") &&
    getKey !== "getUint8"
  ) {
    const key = getKey.slice(3)
    const arrayKey = `${key}Array`
    if (!(arrayKey in globalThis)) continue
    const { BYTES_PER_ELEMENT } = globalThis[arrayKey]
    const setKey = `set${key}`

    /** @this {Buffer} */
    p[`write${key}`] = function (
      value,
      writeOffset = this.writeOffset,
      littleEndian,
    ) {
      const len = writeOffset + BYTES_PER_ELEMENT
      if (len > this.length) this.length = len
      this.view[setKey](writeOffset, value, littleEndian)
      return BYTES_PER_ELEMENT
    }

    /** @this {Buffer} */
    p[`read${key}`] = function (offset = this.offset, littleEndian) {
      this.offset = offset + BYTES_PER_ELEMENT
      return this.view[getKey](offset, littleEndian)
    }

    /** @this {Buffer} */
    p[`read${key}Array`] = function (
      length,
      offset = this.offset,
      littleEndian,
    ) {
      const arr = this[`to${key}Array`](offset, offset + length, littleEndian)
      this.offset = arr.byteLength
      return arr
    }

    /** @this {Buffer} */
    p[`peek${key}Array`] = function (
      length,
      offset = this.offset,
      littleEndian,
    ) {
      return this[`to${key}Array`](offset, offset + length, littleEndian)
    }

    /** @this {Buffer} */
    p[`to${key}Array`] = function (start = 0, end = this.length, littleEndian) {
      const length = (end - start) / BYTES_PER_ELEMENT
      const arr = new globalThis[arrayKey](length)
      const dataview = this.view
      for (let i = start; i < length; i++) {
        arr[i] = dataview[getKey](i * BYTES_PER_ELEMENT, littleEndian)
      }

      return arr
    }
  }
}
