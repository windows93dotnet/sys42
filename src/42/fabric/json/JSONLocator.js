// RFC 6901 - JavaScript Object Notation (JSON) Pointer
// @implement https://tools.ietf.org/html/rfc6901
// @thanks https://github.com/sagold/gson-pointer

import {
  splitJSONPointer,
  // encodeJSONPointer,
  // encodeJSONPointerURI,
  isNextLevelAnArray,
} from "./pointer.js"

export const DEFAULTS = Object.freeze({
  basePrefix: "/",
  uri: false,
  strict: false,
})

export default class JSONLocator {
  constructor(value, options) {
    this.value = value ?? {}
    this.defined = value != null
    this.config = { ...DEFAULTS, ...options }
    if (this.config.uri) this.config.basePrefix = "#/"
  }

  static split = splitJSONPointer

  split(path) {
    return splitJSONPointer(path)
  }

  get(path) {
    if (this.value === undefined) return

    if (path === "" || path === "#") {
      this.found = true
      return this.value
    }

    this.found = false
    let { value } = this

    for (const key of this.split(path)) {
      if (value && typeof value === "object" && key in value) {
        value = value[key]
        this.found = true
      } else {
        value = undefined
        this.found = false
        break
      }
    }

    if (this.config.strict && !this.found) {
      throw new RangeError(`path ${path} does not exist`)
    }

    return value
  }

  set(path, newValue) {
    if (path === "" || path === "#") {
      if (this.config.strict) {
        throw new RangeError(`root object is not writable in strict mode`)
      }

      if (this.value === newValue) return this

      if (typeof newValue === "object") {
        if (Array.isArray(this.value)) {
          if (Array.isArray(newValue)) {
            this.value.length = 0
            this.value.push(...newValue)
          } else this.value = newValue
        } else if (Array.isArray(newValue)) {
          this.value = newValue
        } else {
          this.clear()
          Object.assign(this.value, newValue)
        }
      } else this.value = newValue

      this.defined = true
      return this
    }

    let current = this.value
    path = this.split(path)

    for (let i = 0, l = path.length; i < l; i++) {
      let key = path[i]
      const value = current

      key = key === "-" ? value.length : key
      if (path.length - 1 === i) {
        value[key] = newValue
      } else if (value[key] === undefined) {
        value[key] = isNextLevelAnArray(path[i + 1]) ? [] : {}
      }

      current = value[key]
    }

    return this
  }

  add(path, newValue) {
    const oldValue = this.get(path)
    this.set(path, oldValue ? oldValue + newValue : newValue)
    return this
  }

  assign(path, newValue) {
    const oldValue = this.get(path)
    if (oldValue && typeof oldValue === "object") {
      Object.assign(oldValue, newValue)
    } else this.set(path, newValue)
    return this
  }

  clear() {
    for (const key in this.value) {
      if (Object.hasOwn(this.value, key)) delete this.value[key]
    }

    return this
  }

  // paths(value = this.value, prefix = "") {
  //   const encode = this.config.uri ? encodeJSONPointerURI : encodeJSONPointer
  //   const out = {}
  //   prefix = prefix.length > 0 ? prefix + "/" : this.config.basePrefix
  //   for (const key of Object.keys(value)) {
  //     const encodedKey = encode(key)
  //     if (typeof value[key] === "object") {
  //       Object.assign(out, this.paths(value[key], prefix + encodedKey))
  //     } else out[prefix + encodedKey] = value[key]
  //   }

  //   return out
  // }
}
