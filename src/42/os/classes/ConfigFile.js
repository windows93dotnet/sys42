import system from "../../system.js"
import defer from "../../fabric/type/promise/defer.js"
import getBasename from "../../core/path/core/getBasename.js"
import configure from "../../core/configure.js"
import persist from "../../core/persist.js"
import dispatch from "../../fabric/event/dispatch.js"

export default class ConfigFile {
  constructor(filename, defaults) {
    this.path = `$HOME/${getBasename(filename)}`
    persist.ensureType(filename)
    this.defaults = configure({ version: -1 * Date.now() }, defaults)
  }

  async #init() {
    await (system.DEV !== true && persist.has(this.path)
      ? this.load()
      : this.reset())

    persist.watch(this.path, async () => {
      this.ready = defer()
      await this.load()
      this.ready.resolve()
    })
  }

  async init(...args) {
    this.ready = defer()
    try {
      await this.#init(...args)
      this.ready.resolve()
    } catch (err) {
      this.ready.reject(err)
      throw err
    }
  }

  async load() {
    try {
      this.value = await persist.get(this.path)
    } catch (err) {
      // never let corrupt file index failing a ConfigFile
      dispatch(globalThis, err)
      await this.reset()
    }

    if (this.defaults.version > this.value.version) {
      if (this.upgrade) this.value = await this.upgrade(this.value)
      else await this.reset()
    }

    await this.postload()
  }

  async save() {
    await persist.set(this.path, this.value)
  }

  async update(value) {
    if (typeof value === "function") this.value = await value(this.value)
    else Object.assign(this.value, value)
    await this.save()
  }

  async populate() {}
  async postload() {}

  async reset() {
    this.value = this.defaults
    await this.populate()
    await this.postload()
    await this.save()
  }
}
