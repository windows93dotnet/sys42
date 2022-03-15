import absorb from "../../type/stream/absorb.js"
import addStack from "../../type/error/addStack.js"

export default class Driver {
  constructor(config, stack) {
    this.config = config
    this.stack = stack
  }

  /* check
  ======== */

  async access() {
    throw addStack(
      new Error(`${this.constructor.name}.access() is not implemented`),
      this.stack
    )
  }

  async isFile() {
    throw addStack(
      new Error(`${this.constructor.name}.isFile() is not implemented`),
      this.stack
    )
  }

  async isDir() {
    throw addStack(
      new Error(`${this.constructor.name}.isDir() is not implemented`),
      this.stack
    )
  }

  /* file
  ======= */

  async open() {
    throw addStack(
      new Error(`${this.constructor.name}.open() is not implemented`),
      this.stack
    )
  }

  async read() {
    throw addStack(
      new Error(`${this.constructor.name}.read() is not implemented`),
      this.stack
    )
  }

  async write() {
    throw addStack(
      new Error(`${this.constructor.name}.write() is not implemented`),
      this.stack
    )
  }

  async delete() {
    throw addStack(
      new Error(`${this.constructor.name}.delete() is not implemented`),
      this.stack
    )
  }

  async append() {
    throw addStack(
      new Error(`${this.constructor.name}.append() is not implemented`),
      this.stack
    )
  }

  /* dir
  ====== */

  async writeDir() {
    throw addStack(
      new Error(`${this.constructor.name}.writeDir() is not implemented`),
      this.stack
    )
  }

  async readDir() {
    throw addStack(
      new Error(`${this.constructor.name}.readDir() is not implemented`),
      this.stack
    )
  }

  async deleteDir() {
    throw addStack(
      new Error(`${this.constructor.name}.deleteDir() is not implemented`),
      this.stack
    )
  }

  /* stream
  ========= */

  // Unimplemented streams use read/write

  // TODO: check if encoding option is really needed

  async sink(filename, { encoding }) {
    const buffer = absorb(encoding)
    return {
      write: (chunk) => {
        buffer.add(chunk)
      },
      close: async () => {
        await this.write(filename, buffer.value, { encoding })
      },
    }
  }

  async source(filename, { encoding }) {
    const chunk = await this.read(filename, { encoding })
    return (function* () {
      yield chunk
    })()
  }
}
