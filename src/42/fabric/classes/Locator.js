import exists from "../locator/exists.js"
import locate from "../locator/locate.js"
import allocate from "../locator/allocate.js"
import deallocate from "../locator/deallocate.js"
import merge from "../type/object/merge.js"

export default class Locator {
  constructor(value = {}, options) {
    this.value = value
    this.delimiter = options?.delimiter ?? "."
  }

  has(path) {
    return exists(this.value, path, this.delimiter)
  }

  get(path) {
    return locate(this.value, path, this.delimiter)
  }

  set(path, val) {
    allocate(this.value, path, val, this.delimiter)
  }

  delete(path) {
    deallocate(this.value, path, this.delimiter)
  }

  assign(path, val) {
    const prev = this.get(path)
    if (prev && typeof prev === "object") Object.assign(prev, val)
    else this.set(path, val)
  }

  merge(path, val) {
    const prev = this.get(path)
    if (prev && typeof prev === "object") merge(prev, val)
    else this.set(path, val)
  }

  clear() {
    for (const key in this.value) {
      if (Object.hasOwn(this.value, key)) delete this.value[key]
    }
  }
}
