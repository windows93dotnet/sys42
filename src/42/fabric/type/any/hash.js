import mark from "./mark.js"
import sdbm from "../string/sdbm.js"

const seed = 0x30_96_a3_56_9d_f9

/**
 * Non-cryptographic hash function.
 * Hashes any value into a 12 characters alphanumeric string.
 * The first char is always alphabetical allowing its use as an element id attribute.
 *
 * @param {*} val
 * @returns {string}
 */
export default function hash(val) {
  const n = sdbm(mark(val))
  return (
    String.fromCharCode(97 + (n % 26)) + //
    (n.toString(36).slice(1, 5) + (n * seed).toString(36).slice(1, 8))
  ).padEnd(12, "0")
}
