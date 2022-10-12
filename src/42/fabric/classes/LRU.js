import removeItem from "../type/array/removeItem.js"

export default class LRU extends Map {
  constructor(max = 16) {
    super()
    this.max = max
    this.recency = []
  }

  set(key, val) {
    if (this.size >= this.max) super.delete(this.recency.shift())
    removeItem(this.recency, key)
    this.recency.push(key)
    super.set(key, val)
  }

  get(key) {
    removeItem(this.recency, key)
    this.recency.push(key)
    return super.get(key)
  }

  delete(key) {
    removeItem(this.recency, key)
    super.delete(key)
  }
}
