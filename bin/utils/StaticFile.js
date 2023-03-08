import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import getPathInfos from "../../src/42/core/path/getPathInfos.js"

class StaticFile {
  constructor(filename, index = "index.html") {
    const infos = getPathInfos(filename, { index, headers: true })
    this.filename = fileURLToPath(`file://${infos.filename}`)
    this.search = infos.search
    this.dir = infos.dir
    this.base = infos.base
    this.ext = infos.ext
    this.name = infos.name
    this.charset = infos.charset
    this.mimetype = infos.mimetype
    this.headers = infos.headers
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
