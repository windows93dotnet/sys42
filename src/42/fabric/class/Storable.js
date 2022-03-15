import Database from "../../system/db/Database.js"
import configure from "../configure.js"
import flatten from "../type/object/flatten.js"
import trim from "../type/string/trim.js"
import inOpaqueOrigin from "../../system/env/runtime/inOpaqueOrigin.js"

import exists from "../locator/exists.js"
import locate from "../locator/locate.js"
import allocate from "../locator/allocate.js"
import deallocate from "../locator/deallocate.js"

const DEFAULTS = {
  name: "🔶 - Storable",
  sep: ".",
}

export default class Storable {
  constructor(root = {}, options) {
    this.root = {}
    this.config = configure(DEFAULTS, options)
    this.sep = this.config.sep
    this.store = inOpaqueOrigin
      ? new Map()
      : new Database({
          ...this.config,
          // version: Date.now(),
          populate: async (db) => {
            this.db = db
            await this.populate(root)
          },
        }).store
  }

  async populate(root) {
    if (typeof root === "function") root = await root()
    await this.store.fromEntries(flatten.entries(root, this.sep))
  }

  async init() {
    for await (const [key, val] of this.store.entries()) {
      allocate(this.root, key, val, this.sep)
    }
  }

  has(path) {
    return exists(this.root, path, this.sep)
  }

  async set(path, value) {
    allocate(this.root, path, value, this.sep)
    await this.store.set(trim(path, this.sep), value)
  }

  get(path) {
    return locate(this.root, path, this.sep)
  }

  async delete(path) {
    deallocate(this.root, path, this.sep)
    await this.store.delete(trim(path, this.sep))
  }

  async clear() {
    this.root = {}
    await this.store.clear()
  }
}
