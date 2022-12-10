import absorb from "../stream/absorb.js"
// import addStack from "../../fabric/type/error/addStack.js"

export default class Driver {
  constructor(config) {
    this.config = config
  }

  init() {
    return this
  }

  /* check
  ======== */

  async access() {
    throw new Error(`${this.constructor.name}.access() is not implemented`)
  }

  async isFile() {
    throw new Error(`${this.constructor.name}.isFile() is not implemented`)
  }

  async isDir() {
    throw new Error(`${this.constructor.name}.isDir() is not implemented`)
  }

  /* file
  ======= */

  async open() {
    throw new Error(`${this.constructor.name}.open() is not implemented`)
  }

  async read() {
    throw new Error(`${this.constructor.name}.read() is not implemented`)
  }

  async write() {
    throw new Error(`${this.constructor.name}.write() is not implemented`)
  }

  async delete() {
    throw new Error(`${this.constructor.name}.delete() is not implemented`)
  }

  async append() {
    throw new Error(`${this.constructor.name}.append() is not implemented`)
  }

  /* dir
  ====== */

  async writeDir() {
    throw new Error(`${this.constructor.name}.writeDir() is not implemented`)
  }

  async readDir() {
    throw new Error(`${this.constructor.name}.readDir() is not implemented`)
  }

  async deleteDir() {
    throw new Error(`${this.constructor.name}.deleteDir() is not implemented`)
  }

  /* stream
  ========= */

  // Unimplemented streams use read/write

  // TODO: check if encoding option is really needed

  async sink(filename, options) {
    if (typeof options === "string") options = { encoding: options }
    const buffer = absorb(options?.encoding)
    return {
      write(chunk) {
        buffer.add(chunk)
      },
      close: async () => {
        await this.write(filename, buffer.value, options)
      },
    }
  }

  async source(filename, options) {
    if (typeof options === "string") options = { encoding: options }
    const chunk = await this.read(filename, options)
    return (function* () {
      yield chunk
    })()
  }
}
