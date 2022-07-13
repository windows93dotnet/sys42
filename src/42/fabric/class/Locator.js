import exists from "../locator/exists.js"
import locate from "../locator/locate.js"
import allocate from "../locator/allocate.js"
import deallocate from "../locator/deallocate.js"

export default class Locator {
  constructor(value = {}, options) {
    this.value = value
    this.sep = options?.sep ?? "."
  }

  has(path) {
    return exists(this.value, path, this.sep)
  }

  set(path, value) {
    allocate(this.value, path, value, this.sep)
  }

  get(path) {
    return locate(this.value, path, this.sep)
  }

  delete(path) {
    deallocate(this.value, path, this.sep)
  }

  assign(path, newValue) {
    const oldValue = this.get(path)
    if (oldValue && typeof oldValue === "object") {
      Object.assign(oldValue, newValue)
    } else this.set(path, newValue)
  }

  clear() {
    for (const key in this.value) {
      if (Object.hasOwn(this.value, key)) delete this.value[key]
    }
  }
}
