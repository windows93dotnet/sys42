// @read https://stackoverflow.com/questions/22247614/optimized-bulk-chunk-upload-of-objects-into-indexeddb
// @read https://nolanlawson.com/2021/08/22/speeding-up-indexeddb-reads-and-writes/
// @read https://rxdb.info/slow-indexeddb.html

import DatabaseError from "./DatabaseError.js"
import merge from "../../fabric/type/object/merge.js"

const DEFAULT_ITERATE = {
  value: true,
  key: true,
  one: false,
  mode: "readonly",
  method: "openCursor",
  query: undefined,
  direction: undefined,
  durability: "default",
}

const WRITE_ACTIONS = new Set(["put", "add", "clear", "delete"])

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onerror = (e) => {
      e.stopPropagation()
      reject(new DatabaseError(e.target.error))
    }

    req.onsuccess = (e) => {
      const cursor = e.target.result
      resolve(cursor)
    }

    req.transaction.oncomplete = () => {
      resolve()
    }
  })
}

function predicateObject(object) {
  const entries = Object.entries(object)
  return (value) => {
    if (typeof value !== "object") {
      throw new TypeError("Predicate object only work with object values")
    }

    let ok = true
    for (const [key, test] of entries) {
      if (key in value) {
        if (test instanceof RegExp) {
          if (test.test(value[key]) === false) ok = false
          test.lastIndex = 0
        } else if (Object.is(value[key], test) === false) {
          ok = false
        }
      } else ok = false
    }

    return ok
  }
}

export default class ObjectStore {
  #index
  #signal

  constructor(db, name, index, signal) {
    this.db = db
    this.name = name
    this.#index = index
    this.#signal = signal

    this.range = IDBKeyRange

    // read
    this.count = (key) => this.tx("readonly", "count", key)
    this.get = (key) => this.tx("readonly", "get", key)
    this.key = (key) => this.tx("readonly", "getKey", key)
    this.find = (predicate) =>
      this.iterate({ one: true, key: false }, predicate)
    this.findKey = (predicate) =>
      this.iterate({ one: true, key: true, value: false }, predicate)

    // update
    this.add = (...args) => this.tx("readwrite", "add", ...args)
    this.put = (...args) => this.tx("readwrite", "put", ...args)
    this.clear = () => this.tx("readwrite", "clear")
    this.delete = (key) => this.tx("readwrite", "delete", key)
    this.set = (key, value) => this.put(value, key)

    // list
    this.getAllKeys = (...args) => this.tx("readonly", "getAllKeys", ...args)
    this.getAll = (...args) => this.tx("readonly", "getAll", ...args)

    // iterators
    this.keys = (options) =>
      this.iterate({ ...options, value: false }, () => true)
    this.values = (options) =>
      this.iterate({ ...options, key: false }, () => true)
    this.entries = (options) => this.iterate(options, () => true)

    this.filter = (options, predicate) =>
      predicate === undefined
        ? this.iterate({ key: false }, options)
        : this.iterate({ ...options, key: false }, predicate)
    this.filterKeys = (options, predicate) =>
      predicate === undefined
        ? this.iterate({ key: true, value: false }, options)
        : this.iterate({ ...options, key: true, value: false }, predicate)
  }

  index(index) {
    return new ObjectStore(this.db, this.name, index)
  }

  signal(signal) {
    return new ObjectStore(this.db, this.name, this.#index, signal)
  }

  async update(key, value) {
    const req = await this.tx("readwrite")
    const cursor = await wrap(req.openCursor(key))
    if (cursor === null) throw new RangeError(`No cursor found for ${key}`)

    cursor.update(merge(cursor.value, value))
    await new Promise((resolve) => {
      req.transaction.oncomplete = () => resolve()
    })
    return cursor.key
  }

  async has(key) {
    const cursor = await this.tx("readonly", "openKeyCursor", key)
    return Boolean(cursor)
  }

  async fromEntries(entries) {
    await this.tx("readwrite", ({ store }) => {
      for (const [key, value] of entries) store.put(value, key)
    })
  }

  async from(arr) {
    await this.tx("readwrite", ({ store }) => {
      for (const value of arr) store.put(value)
    })
  }

  async tx(mode, action, ...args) {
    if (this.#signal?.aborted) throw new DOMException("Aborted", "AbortError")

    await this.db.init()
    const db = this.db.indexedDB

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.name, mode, {
        durability: this.db.durability,
      })

      const onabort = () => tx.abort()
      this.#signal?.addEventListener("abort", onabort)
      const end = (e) => {
        e?.stopPropagation()
        this.#signal?.removeEventListener("abort", onabort)
      }

      tx.onerror = (e) => {
        end(e)
        reject(new DatabaseError(tx.error))
      }

      tx.onabort = (e) => {
        end(e)
        reject(new DOMException("Aborted", "AbortError"))
      }

      let store = tx.objectStore(this.name)
      if (this.#index !== undefined) store = store.index(this.#index)

      if (typeof action === "function") {
        tx.oncomplete = () => {
          end()
          resolve()
        }

        action({ store, resolve, reject })
      } else if (action) {
        const req = store[action](...args)

        req.onerror = (e) => {
          end(e)
          reject(new DatabaseError(req.error))
        }

        tx.oncomplete = () => {
          end()
          resolve(req.result)
        }

        if (WRITE_ACTIONS.has(action)) tx.commit?.()
      } else {
        tx.onerror = null
        tx.onabort = null
        resolve(store)
      }
    })
  }

  iterate(options, predicate) {
    if (typeof options === "function") {
      predicate = options
      options = {}
    }

    const config = { ...DEFAULT_ITERATE, ...options }

    if (typeof predicate === "object") predicate = predicateObject(predicate)

    const makeReq = (config, query) =>
      this.tx(config.mode).then((store) =>
        store[config.method](query || config.query, config.direction),
      )

    const txPromise = makeReq(config).then((req) => {
      const append =
        config.key === true && config.value === false
          ? (cursor) => cursor.key
          : config.key === false
          ? (cursor) => cursor.value
          : (cursor) => [cursor.key, cursor.value]

      return [req, append]
    })

    const out = {}

    out[Symbol.asyncIterator] = async function* () {
      let [req, append] = await txPromise

      let cursor = await wrap(req)

      while (cursor) {
        const res = predicate(cursor.value, cursor)
        if (res === true) {
          yield append(cursor)
          if (config.one) return
        }

        try {
          cursor.continue()
        } catch (err) {
          if (
            err.name === "TransactionInactiveError" &&
            config.query === undefined
          ) {
            const query = IDBKeyRange[
              cursor.direction === "prev" || cursor.direction === "prevunique"
                ? "upperBound"
                : "lowerBound"
            ](cursor.key, true)
            req = await makeReq(config, query)
            cursor = await wrap(req)
            continue
          } else throw err
        }

        cursor = await wrap(req)
      }
    }

    out.items = async () => {
      const [req, append] = await txPromise

      return new Promise((resolve, reject) => {
        const items = []

        req.onerror = (e) => {
          e.stopPropagation()
          reject(new DatabaseError(e.target.error))
        }

        req.onsuccess = (e) => {
          const cursor = e.target.result
          if (cursor) {
            let res
            try {
              res = predicate(cursor.value, cursor)
            } catch (err) {
              reject(err)
              return
            }

            if (res === true) {
              items.push(append(cursor))
              if (config.one) return
            }

            cursor.continue()
          }
        }

        req.transaction.oncomplete = config.one
          ? () => resolve(items[0])
          : () => resolve(items)
      })
    }

    out.then = (resolve, reject) => out.items().then(resolve, reject)

    return out
  }
}
