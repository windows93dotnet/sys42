/** {@link https://stackoverflow.com/q/72334889 Source} */
class EntropyPool {
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

const pool = new EntropyPool()

/**
 * Cryptographic unique string ID generator.
 * URL and element ID friendly (the first char is always a lowercase letter).
 * {@link https://github.com/ai/nanoid/blob/main/async/index.browser.js Source}
 * @license Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>. MIT License.
 *
 * @param {number} size the desired string length
 * @returns {string} alphanumeric string
 */
export function uid(size = 8) {
  if (size < 4) size = 4
  let id = String.fromCharCode(97 + (pool.next() % 26))
  size--
  while (size--) {
    const byte = pool.next() & 61
    id +=
      byte < 36 //
        ? byte.toString(36)
        : (byte - 26).toString(36).toUpperCase()
  }

  return id
}

export default uid
