import fs from "node:fs/promises"
import parseFilename from "../../src/42/core/path/parseFilename.js"

class StaticFile {
  constructor(filename, index = "index.html") {
    const obj = parseFilename(filename, { index, headers: true })
    this.filename = obj.filename
    this.query = obj.query
    this.dir = obj.dir
    this.base = obj.base
    this.ext = obj.ext
    this.name = obj.name
    this.charset = obj.charset
    this.mimetype = obj.mimetype
    this.headers = obj.headers
  }

  stream(encoding = this.charset) {
    return this.handle.createReadStream({ encoding })
  }

  async read(encoding = this.charset) {
    this.content = await this.handle.readFile({ encoding })
    return this.content
  }

  async open() {
    this.handle = await fs.open(this.filename, "r")
    this.fd = this.handle.fd
    this.stat = await this.handle.stat()
    if (!this.stat.isFile()) throw new Error(`${this.filename} is not a file`)
    this.headers["content-length"] = this.stat.size
    this.headers["last-modified"] = this.stat.mtime.toUTCString()
  }

  async close() {
    await this.handle?.close()
  }
}

export default StaticFile
