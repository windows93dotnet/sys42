import fs from "../../system/fs.js"
import extname from "../../fabric/type/path/extract/extname.js"
import resolvePath from "../../fabric/type/path/core/resolvePath.js"
import configure from "../../fabric/configure.js"

export class ConfigFile {
  constructor(filename, defaults) {
    this.filename = resolvePath(filename)
    this.type = (extname(this.filename) || ".cbor").slice(1)
    this.defaults = configure({ version: -1 * Date.now() }, defaults)
  }

  async init() {
    await ((await fs.access(this.filename)) === false //
      ? this.reset()
      : this.open())

    // fs.on(this.name, () => this.open())
  }

  async open() {
    this.value = await fs.read[this.type](this.filename)
    if (this.defaults.version > this.value.version) await this.reset()
  }

  async save() {
    await fs.write[this.type](this.filename, this.value)
  }

  async update(value) {
    if (typeof value === "function") this.value = await value(this.value)
    else Object.assign(this.value, value)
    await this.save()
  }

  async reset() {
    this.value = this.defaults
    await this.save()
  }
}

export default async function configFile(...args) {
  return new ConfigFile(...args).init()
}
