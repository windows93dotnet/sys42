import inTop from "../../core/env/realm/inTop.js"
import system from "../../system.js"
import defer from "../../fabric/type/promise/defer.js"
import getBasename from "../../core/path/core/getBasename.js"
import normalizeFilename from "../../core/fs/normalizeFilename.js"
import configure from "../../core/configure.js"
import persist from "../../core/persist.js"
import dispatch from "../../fabric/event/dispatch.js"

export default class ConfigFile {
  #instanceInit

  constructor(filename, defaults) {
    this.path = normalizeFilename(`$HOME/${getBasename(filename)}`)
    persist.ensureType(filename)
    this.defaults = defaults
    this.version ??= -1 * Date.now()
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
  }

  async load() {
    try {
      this.value = await persist.get(this.path)
    } catch (err) {
      // never let a corrupt file fail a ConfigFile
      dispatch(globalThis, err)
      await this.reset()
    }

    if (this.version > this.value.version) {
      const { name } = this.constructor
      const path = location.origin + this.path
      if (this.upgrade) {
        console.warn(
          `${name} config file was upgraded to version ${this.version}. ${path}`,
        )
        this.value = await this.upgrade(this.value)
      } else {
        // TODO: Use confirm.js to warn user
        console.warn(
          `Reseting ${name} config file because the version was obsolete. ${path}`,
        )
        await this.reset()
      }
    }

    delete this.value.version

    await this.postload()
  }

  async save() {
    this.value.version = this.version
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
