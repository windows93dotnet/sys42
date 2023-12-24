const windowExist = globalThis.window !== undefined
const selfExist = globalThis.self !== undefined

let stringCache
const stringIgnore = new Set([
  "inWindow",
  "inWorker",
  "inOpaqueOrigin",
  "toString",
])

class Realm {
  constructor() {
    this.inWindow = windowExist && window === window.self
    this.inChildWindow = windowExist && globalThis.opener !== null

    this.inTop = windowExist && window === window.top
    this.inIframe = windowExist && window !== window.top
    this.inOpaqueOrigin = globalThis.origin === "null"

    this.inWorker =
      selfExist &&
      globalThis.WorkerGlobalScope !== undefined &&
      self instanceof WorkerGlobalScope
    this.inSharedWorker =
      selfExist &&
      globalThis.SharedWorkerGlobalScope !== undefined &&
      self instanceof SharedWorkerGlobalScope
    this.inServiceWorker =
      selfExist &&
      globalThis.ServiceWorkerGlobalScope !== undefined &&
      self instanceof ServiceWorkerGlobalScope
    this.inDedicatedWorker =
      selfExist &&
      globalThis.DedicatedWorkerGlobalScope !== undefined &&
      self instanceof DedicatedWorkerGlobalScope

    Object.freeze(this)
  }

  [Symbol.toPrimitive]() {
    if (stringCache) return stringCache

    for (const [key, val] of Object.entries(this)) {
      if (stringIgnore.has(key)) continue
      if (val) {
        stringCache = key[2].toLowerCase() + key.slice(3)
        return stringCache
      }
    }
  }

  toString() {
    return this[Symbol.toPrimitive]()
  }
}

export const realm = new Realm()
export default realm
