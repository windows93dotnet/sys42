import Stub from "./Stub.js"

const originals = new WeakMap()

export default class Spy extends Stub {
  constructor(object, key, fn, thisArg) {
    if (typeof object === "string") {
      fn = key
      key = object
      object = globalThis
    }

    if (typeof object !== "object") {
      throw new TypeError(`spy "object" is not an object`)
    }

    if (key in object === false || typeof object[key] !== "function") {
      throw new Error(`no "${key}" method in spy object`)
    }

    let method = object[key]
    if (originals.has(method)) method = originals.get(method)

    if (fn) super(fn, thisArg)
    else super(method, thisArg === false ? false : thisArg ?? object)

    this.original = { object, key, method }
    originals.set(this, method)

    object[key] = this
  }

  restore() {
    if (!this.original) return
    const { object, key, method } = this.original
    if (key in object) object[key] = method
  }
}
