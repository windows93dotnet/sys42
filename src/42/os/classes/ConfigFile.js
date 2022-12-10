import inTop from "../../core/env/realm/inTop.js"
import system from "../../system.js"
import defer from "../../fabric/type/promise/defer.js"
import getBasename from "../../core/path/core/getBasename.js"
import configure from "../../core/configure.js"
import persist from "../../core/persist.js"
import dispatch from "../../fabric/event/dispatch.js"

export default class ConfigFile {
  #instanceInit

  constructor(filename, defaults) {
    this.path = `$HOME/${getBasename(filename)}`
    persist.ensureType(filename)
    this.defaults = configure({ version: -1 * Date.now() }, defaults)

    this.ready = defer()
    this.#instanceInit = this.init
    this.init = async (...args) => {
      try {
        await this.#init(...args)
        if (this.#instanceInit) await this.#instanceInit(...args)
        this.ready.resolve()
      } catch (err) {
        this.ready.reject(err)
        throw err
      }
    }
  }

  async #init() {
    if (inTop) {
      await (system.DEV !== true && persist.has(this.path)
        ? this.load()
        : this.reset())
    } else {
      await this.load()
    }

    persist.watch(this.path, async () => {
      await this.load()
      // this.ready.resolve()
    })
  }

  async load() {
    try {
      this.value = await persist.get(this.path)
    } catch (err) {
      // never let a corrupt file fail a ConfigFile
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
    return persist.set(this.path, this.value)
  }

  async update(value) {
    if (typeof value === "function") this.value = await value(this.value)
    else Object.assign(this.value, value)
    return this.save()
  }

  async populate() {}
  async postload() {}

  async reset() {
    this.value = configure(this.defaults, await this.populate())
    await this.postload()
    return this.save()
  }
}
