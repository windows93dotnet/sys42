import removeItem from "../type/array/removeItem.js"

/**
 * [Least Recently Used](https://en.wikipedia.org/wiki/Least_frequently_used) cache.
 */
export default class LRU extends Map {
  #recency

  constructor(max = 16) {
    super()
    this.max = max
    this.#recency = []
  }

  set(key, val) {
    if (this.size >= this.max) super.delete(this.#recency.shift())
    removeItem(this.#recency, key)
    this.#recency.push(key)
    return super.set(key, val)
  }

  get(key) {
    removeItem(this.#recency, key)
    this.#recency.push(key)
    return super.get(key)
  }

  delete(key) {
    removeItem(this.#recency, key)
    return super.delete(key)
  }

  clear() {
    this.#recency.length = 0
    return super.clear()
  }
}
