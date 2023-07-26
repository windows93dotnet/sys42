import Database from "../../core/db/Database.js"
import configure from "../../core/configure.js"
import flatten from "../type/object/flatten.js"
import trim from "../type/string/trim.js"
import defer from "../type/promise/defer.js"
import Locator from "./Locator.js"

const DEFAULTS = {
  name: "storable",
  delimiter: ".",
}

export default class Storable extends Locator {
  constructor(value, options) {
    super(value, options)
    this.config = configure(DEFAULTS, options)

    this.ready = defer()

    this.store = new Database({
      ...this.config,
      // version: Date.now(),
      populate: async () => {
        await this.populate()
      },
    }).store
  }

  async populate() {
    const value =
      typeof this.config.populate === "function"
        ? await this.config.populate()
        : this.value

    await this.store.fromEntries(flatten.entries(value, this.delimiter))
  }

  async init() {
    await this.store
    for await (const [key, val] of this.store.entries()) {
      super.set(key, val)
    }

    this.ready.resolve()
  }

  async set(path, value) {
    super.set(path, value)
    await this.store.set(trim(path, this.delimiter), value)
  }

  async delete(path) {
    super.delete(path)
    await this.store.delete(trim(path, this.delimiter))
  }

  async clear() {
    super.clear()
    await this.store.clear()
  }
}
