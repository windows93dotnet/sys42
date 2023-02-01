import "../env/polyfills/ReadableStream.prototype.values.js"

import system from "../../system.js"
import Driver from "./Driver.js"
import Disk from "./Disk.js"
import uid from "../uid.js"
import FileSystemError from "../fs/FileSystemError.js"
import http from "../http.js"

let disk

const { ENOENT, EISDIR, EEXIST, ENOTDIR } = FileSystemError

export default class BrowserDriver extends Driver {
  static toFile = (bits, encoding) =>
    new Blob(bits, {
      type: encoding
        ? `text/plain;charset=${encoding}`
        : "application/octet-stream",
    })

  static fromFile = async (data, encoding) => {
    const buf = await data.arrayBuffer()
    return encoding ? new TextDecoder(encoding).decode(buf) : buf
  }

  constructor(getDriver) {
    super()
    this.getDriver = getDriver
    this.store = this.constructor.store
    this.mask = this.constructor.mask
    this.name = this.constructor.name.slice(0, -6).toLowerCase()
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

  async getURL(filename) {
    if (!disk.has(filename)) {
      if (filename.startsWith("http") || filename.startsWith("//")) {
        return filename
      }

      throw new FileSystemError(ENOENT, filename)
    }

    const desc = disk.get(filename)
    if (desc === 0) return filename
    if (desc?.[0] === -1) return this.getURL(desc[1])

    const blob = await this.open(filename)
    const objectURL = URL.createObjectURL(blob)
    return objectURL
  }

  async isDir(filename) {
    return disk.isDir(filename)
  }
  async isFile(filename) {
    return disk.isFile(filename)
  }
  async isLink(filename) {
    return disk.isLink(filename)
  }

  async link(source, destination) {
    return disk.link(source, destination)
  }

  /* file
  ======= */

  async open(filename) {
    if (!disk.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (disk.isDir(filename)) throw new FileSystemError(EISDIR, filename)

    const entry = disk.get(filename)

    if (entry === 0) {
      const res = await http.get(filename)
      return res.blob()
    }

    const [id, mask] = entry

    if (id === -1) return this.open(mask)

    entry[2].a = Date.now()
    disk.set(filename, entry, { silent: true })

    if (this.mask !== mask) {
      const driver = await this.getDriver(mask)
      return driver.open(filename)
    }

    const blob = await this.store.get(id)

    if (blob === undefined) {
      // TODO: remove memoryDriver files from FileIndex on init
      disk.delete(filename, { silent: true })
      throw new FileSystemError(ENOENT, filename)
    }

    return blob
  }

  async read(filename, options) {
    if (typeof options === "string") options = { encoding: options }
    return BrowserDriver.fromFile(await this.open(filename), options?.encoding)
  }

  async write(filename, data, options) {
    if (disk.isDir(filename)) throw new FileSystemError(EISDIR, filename)

    if (typeof options === "string") options = { encoding: options }

    let id
    let entry = disk.get(filename)

    if (entry) {
      id = entry[0]
      const mask = entry[1]

      if (this.mask !== mask) {
        const driver = await this.getDriver(mask)
        driver.delete(filename)
      }

      entry[2].m = Date.now()
      entry[2].c = entry[2].m
      disk.set(filename, entry)
    } else {
      id = uid()
      const time = Date.now()
      entry = [id, this.mask, { a: time, c: time, m: time, cr: time }]
      disk.set(filename, entry)
    }

    await this.store.set(id, BrowserDriver.toFile([data], options?.encoding))
  }

  async append(filename, data, options) {
    if (!disk.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (disk.isDir(filename)) throw new FileSystemError(EISDIR, filename)

    if (typeof options === "string") options = { encoding: options }
    const entry = disk.get(filename)
    const id = entry === 0 ? uid() : entry[0]
    const prev = await this.open(filename)
    const bits = [prev, data]
    return this.store.set(id, BrowserDriver.toFile(bits, options?.encoding))
  }

  async delete(filename) {
    if (!disk.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (disk.isDir(filename)) throw new FileSystemError(EISDIR, filename)

    let id
    const previous = disk.get(filename)

    disk.delete(filename)

    if (previous) {
      id = previous[0]
      const mask = previous[1]
      if (this.mask !== mask) {
        const driver = await this.getDriver(mask)
        await driver.delete(filename)
        return
      }

      await this.store.delete(id)
    }
  }

  /* dir
  ====== */

  async writeDir(filename) {
    if (disk.has(filename) && disk.isFile(filename)) {
      throw new FileSystemError(EEXIST, filename)
    }

    disk.set(filename, {})
  }

  async readDir(filename, options) {
    return disk.readDir(filename, options)
  }

  async deleteDir(filename) {
    if (!disk.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (!disk.isDir(filename)) throw new FileSystemError(ENOTDIR, filename)

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

  async source(filename, options) {
    if (typeof options === "string") options = { encoding: options }

    const blob = await this.open(filename)
    let stream = blob.stream()

    if (options?.encoding) {
      stream = stream.pipeThrough(new TextDecoderStream(options.encoding))
    }

    return stream[Symbol.asyncIterator]()
  }
}
