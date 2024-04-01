import "../env/polyfills/ReadableStream.prototype.values.js"

import system from "../../system.js"
import Driver from "./Driver.js"
import FileIndex from "./FileIndex.js"
import uid from "../uid.js"
import FileSystemError from "../fs/FileSystemError.js"
import http from "../http.js"

let fileIndex

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
    if (system.fileIndex) fileIndex = system.fileIndex
    else {
      fileIndex = new FileIndex()
      await fileIndex.init()
    }

    return this
  }

  /* check
  ======== */

  async access(filename) {
    return fileIndex.has(filename)
  }

  async getURL(filename, options) {
    if (!fileIndex.has(filename)) {
      if (filename.startsWith("http") || filename.startsWith("//")) {
        return filename
      }

      throw new FileSystemError(ENOENT, filename)
    }

    const inode = fileIndex.get(filename)
    if (inode === 0) return filename
    if (inode?.[0] === -1) return this.getURL(inode[1])

    const blob = await this.open(filename)
    const objectURL = URL.createObjectURL(blob)

    options?.signal.addEventListener("abort", () =>
      URL.revokeObjectURL(objectURL),
    )

    return objectURL
  }

  async isDir(filename) {
    return fileIndex.isDir(filename)
  }
  async isFile(filename) {
    return fileIndex.isFile(filename)
  }
  async isLink(filename) {
    return fileIndex.isLink(filename)
  }

  async link(source, destination) {
    return fileIndex.link(source, destination)
  }

  /* file
  ======= */

  async open(filename) {
    if (!fileIndex.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (fileIndex.isDir(filename)) {
      throw new FileSystemError(EISDIR, filename)
    }

    const inode = fileIndex.get(filename)

    if (inode === 0) {
      const res = await http.get(filename)
      return res.blob()
    }

    const [id, mask] = inode

    if (id === -1) return this.open(mask)

    inode[2].a = Date.now()
    fileIndex.set(filename, inode, { silent: true })

    if (this.mask !== mask) {
      const driver = await this.getDriver(mask)
      return driver.open(filename)
    }

    const blob = await this.store.get(id)

    if (blob === undefined) {
      // TODO: remove memoryDriver files from FileIndex on init
      fileIndex.delete(filename, { silent: true })
      throw new FileSystemError(ENOENT, filename)
    }

    return blob
  }

  async read(filename, options) {
    if (typeof options === "string") options = { encoding: options }
    return BrowserDriver.fromFile(await this.open(filename), options?.encoding)
  }

  async write(filename, data, options) {
    if (fileIndex.isDir(filename)) throw new FileSystemError(EISDIR, filename)

    if (typeof options === "string") options = { encoding: options }

    let id
    let inode = fileIndex.get(filename)

    if (inode) {
      id = inode[0]
      const mask = inode[1]

      if (this.mask !== mask) {
        const driver = await this.getDriver(mask)
        driver.delete(filename)
      }

      inode[2].m = Date.now()
      fileIndex.set(filename, inode)
    } else {
      id = uid()
      // @read https://man7.org/linux/man-pages/man7/inode.7.html
      // @read https://www.thegeekdiary.com/unix-linux-access-control-lists-acls-basics/
      const time = Date.now()
      inode = [
        id,
        this.mask,
        {
          b: time, // File creation (birth)
          a: time, // Last access
          c: time, // Last status change
          m: time, // Last modification
        },
      ]
      fileIndex.set(filename, inode)
    }

    await this.store.set(id, BrowserDriver.toFile([data], options?.encoding))
  }

  async append(filename, data, options) {
    if (!fileIndex.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (fileIndex.isDir(filename)) {
      throw new FileSystemError(EISDIR, filename)
    }

    if (typeof options === "string") options = { encoding: options }
    const inode = fileIndex.get(filename)
    const id = inode === 0 ? uid() : inode[0]
    const prev = await this.open(filename)
    const bits = [prev, data]
    return this.store.set(id, BrowserDriver.toFile(bits, options?.encoding))
  }

  async delete(filename) {
    if (!fileIndex.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (fileIndex.isDir(filename)) {
      throw new FileSystemError(EISDIR, filename)
    }

    const inode = fileIndex.get(filename)

    fileIndex.delete(filename)

    if (inode) {
      const [id, mask] = inode

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
    if (fileIndex.has(filename) && fileIndex.isFile(filename)) {
      throw new FileSystemError(EEXIST, filename)
    }

    fileIndex.set(filename, {})
  }

  async readDir(filename, options) {
    return fileIndex.readDir(filename, options)
  }

  async deleteDir(filename) {
    if (!fileIndex.has(filename)) throw new FileSystemError(ENOENT, filename)
    else if (!fileIndex.isDir(filename)) {
      throw new FileSystemError(ENOTDIR, filename)
    }

    await Promise.all(
      fileIndex
        .readDir(filename, { absolute: true })
        .map((path) =>
          path.endsWith("/") ? this.deleteDir(path) : this.delete(path),
        ),
    )

    fileIndex.delete(filename)
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
