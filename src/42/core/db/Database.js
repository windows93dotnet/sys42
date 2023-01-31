import DatabaseError from "./DatabaseError.js"
import ObjectStore from "./ObjectStore.js"
import configure from "../configure.js"

const DEFAULTS = {
  name: "database",
  version: 1,
  stores: {},
  durability: "default",
}

const debug = 0

export class Database {
  #config
  #obsolete = false

  static async list() {
    return indexedDB.databases()
  }

  static async open(name, version, { blocked, upgrade, downgrade } = {}) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version)

      if (blocked) req.onblocked = blocked

      let pending

      req.onupgradeneeded = ({ target, oldVersion, newVersion }) => {
        if (debug) console.log("db onupgradeneeded", name)
        if (upgrade) {
          pending = upgrade(target.result, {
            oldVersion,
            newVersion,
            transaction: req.transaction,
          }).catch(reject)
        }
      }

      req.onerror = async ({ target }) => {
        if (downgrade && target.error.name === "VersionError") {
          try {
            const db = await Database.open(name)
            await downgrade(db, {
              oldVersion: db.version,
              newVersion: version,
              transaction: req.transaction,
            })
            resolve(await Database.open(name, version))
          } catch (err) {
            reject(err)
          }
        } else reject(new DatabaseError(target.error))
      }

      req.onsuccess = async (e) => {
        if (pending) await pending
        resolve(e.target.result)
      }
    })
  }

  static async delete(name, { blocked } = {}) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(name)
      if (blocked) req.onblocked = blocked
      req.onsuccess = () => resolve()
      req.onerror = () =>
        reject(
          new DatabaseError(`Couldn't delete database ${this.#config.name}`)
        )
    })
  }

  constructor(name, options = {}) {
    if (typeof name === "string") options.name = name
    else options = name ?? {}
    if ("stores" in options === false) options.stores = { store: {} }

    this.#config = configure(DEFAULTS, options)

    this.indexedDB = undefined
    this.name = this.#config.name
    this.durability = this.#config.durability
    this.range = IDBKeyRange
    this.stores = {}

    Object.keys(this.#config.stores).forEach((name) =>
      this.#registerStore(name)
    )
  }

  #registerStore(name) {
    const descriptor = { get: () => new ObjectStore(this, name) }
    if (!(name in this)) Object.defineProperty(this, name, descriptor)
    Object.defineProperty(this.stores, name, descriptor)
  }

  #registerDB(db) {
    db.addEventListener("close", () => {
      if (debug) console.log("db close")
      this.indexedDB = undefined
    })
    db.addEventListener("versionchange", () => {
      if (debug) console.log("db versionchange")
      db.close()
      this.#obsolete = true
      this.indexedDB = undefined
    })
    return db
  }

  async #downgrade(db, arg) {
    if (this.#config.downgrade) {
      const res = await this.#config.downgrade(this, db, arg)
      if (res === false) return
    }

    db.close()
    await Database.delete(db.name)
  }

  async #upgrade(db, arg) {
    let { stores } = this.#config

    if (this.#config.upgrade) {
      const res = await this.#config.upgrade(this, db, arg)
      if (res === false) return
      if (typeof res === "object") stores = res
    }

    for (const [name, schema] of Object.entries(stores)) {
      if (db.objectStoreNames.contains(name)) {
        db.deleteObjectStore(name)
      }

      const storeConfig = {}
      const indexes = []

      for (const [key, desc] of Object.entries(schema)) {
        if (desc.autoIncrement) {
          storeConfig.autoIncrement = desc.autoIncrement
        }

        if (desc.keyPath) {
          if (typeof storeConfig.keyPath === "string") {
            storeConfig.keyPath = [storeConfig.keyPath, key]
          } else if (Array.isArray(storeConfig.keyPath)) {
            storeConfig.keyPath.push(key)
          } else {
            storeConfig.keyPath = key
          }
        }

        if ("unique" in desc || "index" in desc) {
          indexes.push([key, { unique: Boolean(desc.unique) }])
        }
      }

      if (
        "keyPath" in storeConfig === false &&
        "autoIncrement" in storeConfig === false
      ) {
        storeConfig.autoIncrement = true
      }

      const store = db.createObjectStore(name, storeConfig)
      indexes.forEach(([key, config]) => store.createIndex(key, key, config))
    }

    if (this.#config.populate) {
      if (debug) console.log("db populate", this.name)
      await this.#config.populate(this, db, arg)
    }
  }

  async init() {
    if (this.indexedDB) return this.indexedDB

    if (this.#obsolete) {
      throw new DatabaseError("Database is obsolete")
    }

    const { name, version } = this.#config
    this.indexedDB = await Database.open(name, version, {
      upgrade: async (...args) => this.#upgrade(...args),
      downgrade: async (...args) => this.#downgrade(...args),
    })
    this.#registerDB(this.indexedDB)

    return this
  }

  then(resolve, reject) {
    this.init().then(resolve, reject)
  }

  async destroy(arg) {
    this.indexedDB?.close()
    await Database.delete(this.#config.name, arg)
  }
}

export default Database
