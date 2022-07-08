import mark from "./mark.js"
import sdbm from "../string/sdbm.js"

/**
 * Non-cryptographic hash function.
 * Hashes any value into the most unique possible short string.
 * @param {*} val
 * @returns {string}
 */

export default function hash(val) {
  const h = sdbm(mark(val))
  return (
    String.fromCharCode(97 + (Number(h.toString(10).slice(-2)) % 26)) +
    (h.toString(32) + (h * 1e10).toString(16)).slice(0, 11)
  )
}
