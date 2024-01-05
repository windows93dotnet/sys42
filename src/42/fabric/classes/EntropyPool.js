/**
 * @source https://stackoverflow.com/q/72334889
 */
export class EntropyPool {
  #entropy
  #index
  #size

  constructor(size = 1024) {
    this.#entropy = new Uint32Array(size)
    this.#size = size
    this.#index = 0
    crypto.getRandomValues(this.#entropy)
  }

  next() {
    const value = this.#entropy[this.#index++]
    if (this.#index === this.#size) {
      crypto.getRandomValues(this.#entropy)
      this.#index = 0
    }

    return value
  }
}

export default EntropyPool
