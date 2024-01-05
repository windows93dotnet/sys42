import EntropyPool from "../fabric/classes/EntropyPool.js"

const pool = new EntropyPool()

/**
 * Cryptographic unique string ID generator.\
 * URL and element ID friendly (the first char is always a lowercase letter).\
 * See: https://zelark.github.io/nano-id-cc/
 * @thanks https://github.com/ai/nanoid/blob/main/index.browser.js
 *
 * @param {number} [size] the desired string length (Default: 8)
 * @returns {string} alphanumeric string
 */
export function uid(size = 8) {
  if (size < 4) size = 4
  let id = String.fromCharCode(97 + (pool.next() % 26))
  size--
  while (size--) {
    const byte = pool.next() & 61
    id +=
      byte < 36
        ? byte.toString(36) //
        : (byte - 26).toString(36).toUpperCase()
  }

  return id
}

export default uid
