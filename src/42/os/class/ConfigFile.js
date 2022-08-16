import system from "../../system.js"
import fs from "../../core/fs.js"
import disk from "../../core/disk.js"
import defer from "../../fabric/type/promise/defer.js"
import extname from "../../fabric/type/path/extract/extname.js"
import basename from "../../fabric/type/path/extract/basename.js"
import configure from "../../core/configure.js"

const VALID_TYPES = new Set([".json", ".json5", ".cbor"])

export class ConfigFile {
  constructor(filename, defaults) {
    this.filename = `${system.HOME}/${basename(filename)}`
    const ext = extname(this.filename)
    if (!VALID_TYPES.has(ext)) {
      throw new Error(
        `Config file must have a .json, .json5 or .cbor extension: ${ext}`
      )
    }

    this.type = ext.slice(1)
    this.defaults = configure({ version: -1 * Date.now() }, defaults)
  }

  async #init() {
    await (system.DEV !== true && disk.has(this.filename)
      ? this.load()
      : this.reset())

    // fs.on(this.name, async () => {
    //   this.ready = defer()
    //   await this.open()
    //   this.ready.resolve()
    // })
  }

  async init(...args) {
    this.ready ??= defer()
    try {
      await this.#init(...args)
      this.ready.resolve()
    } catch (err) {
      this.ready.reject(err)
      throw err
    }
  }

  async load() {
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

  async populate() {}

  async reset() {
    this.value = this.defaults
    await this.populate()
    await this.save()
  }
}

export default async function configFile(...args) {
  return new ConfigFile(...args).init()
}
