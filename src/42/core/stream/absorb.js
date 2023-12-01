export const AbsorbArrayBuffer = globalThis.WebAssembly?.Memory
  ? class AbsorbArrayBuffer {
      constructor() {
        this.pointer = 0
        this.memory = new WebAssembly.Memory({ initial: 1 })
        this.view = new Uint8Array(this.memory.buffer)
      }

      get buffer() {
        return new Uint8Array(this.memory.buffer) //
          .slice(0, this.pointer).buffer
      }

      add(chunk) {
        if (this.pointer + chunk.byteLength > this.memory.buffer.byteLength) {
          this.memory.grow(Math.ceil(chunk.byteLength / 0x01_00_00))
          this.view = new Uint8Array(this.memory.buffer)
        }

        this.view.set(new Uint8Array(chunk), this.pointer)
        this.pointer += chunk.byteLength
      }
    }
  : class AbsorbArrayBuffer {
      constructor() {
        this.array = []
      }

      get buffer() {
        return new Uint8Array(this.array).buffer
      }

      add(chunk) {
        this.array.push(...chunk)
      }
    }

export class AbsorbText {
  constructor() {
    this.buffer = ""
  }

  add(chunk) {
    this.buffer += chunk
  }
}

export class AbsorbArray {
  constructor() {
    this.buffer = []
  }

  add(chunk) {
    this.buffer.push(chunk)
  }
}

class Absorb {
  constructor(encoding) {
    this.auto = encoding === "auto"
    this.encoding = this.auto ? undefined : encoding
  }

  add(chunk) {
    if (this.absorber) {
      const type = typeof chunk

      if (type === "string") {
        if (this.encoder) chunk = this.encoder.encode(chunk, { stream: true })
      } else if (this.decoder) {
        chunk = this.decoder.decode(chunk, { stream: true })
      }

      this.absorber.add(chunk)
    } else {
      const chunkIsString = typeof chunk === "string"
      const chunkIsArrayBuffer =
        ArrayBuffer.isView(chunk) || chunk instanceof ArrayBuffer

      this.absorber = chunkIsString
        ? new AbsorbText()
        : chunkIsArrayBuffer
          ? new AbsorbArrayBuffer()
          : new AbsorbArray()

      if (chunkIsString) {
        this.decoder = new TextDecoder(this.encoding)
      } else if (chunkIsArrayBuffer) {
        this.encoder = new TextEncoder(this.encoding)
      }

      this.absorber.add(chunk)
    }
  }

  get value() {
    if (this.encoder) {
      this.absorber.add(this.encoder.encode())
      return this.auto || !this.encoding
        ? this.absorber.buffer
        : new TextDecoder(this.encoding).decode(this.absorber.buffer)
    }

    if (this.decoder) {
      this.absorber.add(this.decoder.decode())
      return this.auto || this.encoding
        ? this.absorber.buffer
        : new TextEncoder(this.encoding).encode(this.absorber.buffer).buffer
    }

    return this.absorber.buffer
  }
}

export default function absorb(encoding) {
  return new Absorb(encoding)
}

absorb.text = () => new AbsorbText()
absorb.array = () => new AbsorbArray()
absorb.arrayBuffer = () => new AbsorbArrayBuffer()
