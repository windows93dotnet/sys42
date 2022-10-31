/* eslint-disable no-throw-literal */
import "../env/polyfills/ReadableStream.prototype.values.js"
import system from "../../system.js"
import Disk, { RESERVED_BYTES } from "./Disk.js"
import Driver from "./Driver.js"

let disk
const { random, floor } = Math

export default class BrowserDriver extends Driver {
  static toFile = (data, encoding) =>
    new Blob(data, {
      type: encoding
        ? `text/plain;charset=${encoding}`
        : "application/octet-stream",
    })

  static fromFile = (data, encoding) => {
    // TODO: use FileReader for non-utf8 encoding ?
    if (encoding) return data.text()
    return data.arrayBuffer()
  }

  makeID() {
    const max = Number.MAX_SAFE_INTEGER - this.reservedBytes
    let id = floor(random() * max)
    id -= id & (this.reservedBytes - 1) /* reserve last bits */
    id += this.mask /* apply mask */
    return id
  }

  constructor(config, stack, getDriver) {
    super(config, stack)
    this.getDriver = getDriver
    this.store = this.constructor.store
    this.mask = this.constructor.mask
    this.reservedBytes = RESERVED_BYTES
  }

  async init() {
    if (system.disk) disk = system.disk
    else {
      disk = new Disk()
      await disk.init()
    }

    return this
  }

  /* check
  ======== */

  async access(filename) {
    return disk.has(filename)
  }

  async isDir(filename) {
    return disk.isDir(filename)
  }
  async isFile(filename) {
    return disk.isFile(filename)
  }

  /* file
  ======= */

  async open(filename) {
    if (!disk.has(filename)) throw { errno: 2 }
    else if (disk.isDir(filename)) throw { errno: 21 }

    const { id, mask } = await disk.getIdAndMask(filename)

    if (this.mask !== mask) {
      const driver = await this.getDriver(mask)
      return driver.open(filename)
    }

    const blob = await this.store.get(id)

    if (blob === undefined) {
      // TODO: remove memoryDriver files from FileIndex on init
      disk.delete(filename)
      throw { errno: 2 }
    }

    return blob
  }

  async read(filename, { encoding }) {
    return BrowserDriver.fromFile(await this.open(filename), encoding)
  }

  async write(filename, data, { encoding }) {
    if (disk.isDir(filename)) throw { errno: 21 }
    if (ArrayBuffer.isView(data)) data = data.buffer

    let { id, mask } = await disk.getIdAndMask(filename)

    if (id === undefined) {
      id = this.makeID()
      disk.set(filename, id)
    } else if (this.mask !== mask) {
      const driver = await this.getDriver(mask)
      driver.delete(filename)
      id = this.makeID()
      disk.set(filename, id)
    }

    return this.store.set(id, BrowserDriver.toFile([data], encoding))
  }

  async delete(filename) {
    if (!disk.has(filename)) throw { errno: 2 }
    else if (disk.isDir(filename)) throw { errno: 21 }

    const { id, mask } = await disk.getIdAndMask(filename)

    disk.delete(filename)

    if (mask === 0x00) return false

    if (this.mask !== mask) {
      const driver = await this.getDriver(mask)
      return driver.delete(filename)
    }

    return this.store.delete(id)
  }

  async append(filename, data, { encoding }) {
    const prev = await this.open(filename)
    const id = disk.get(filename)
    return this.store.set(id, BrowserDriver.toFile([prev, data], encoding))
  }

  /* dir
  ====== */

  async writeDir(filename) {
    if (disk.has(filename) && disk.isFile(filename)) throw { errno: 17 }
    disk.set(filename, {})
  }

  async readDir(filename, options) {
    return disk.readDir(filename, options)
  }

  async deleteDir(filename) {
    if (!disk.has(filename)) throw { errno: 2 }
    else if (!disk.isDir(filename)) throw { errno: 20 }

    await Promise.all(
      disk
        .readDir(filename, { absolute: true })
        .map((path) =>
          path.endsWith("/") ? this.deleteDir(path) : this.delete(path)
        )
    )

    disk.delete(filename)
  }

  /* stream
  ========= */

  async source(filename, { encoding }) {
    const blob = await this.open(filename)
    let stream = blob.stream()
    if (encoding) stream = stream.pipeThrough(new TextDecoderStream(encoding))
    return stream[Symbol.asyncIterator]()
  }
}
