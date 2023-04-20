import mark from "./mark.js"
import sdbm from "../string/sdbm.js"

const MAGIC_NUMBER = 0x30_96_a3_56_9d_f9

/**
 * Non-cryptographic hash function.
 * Hashes any value into a 12 characters alphanumeric string.
 * URL and element ID friendly (the first char is always a lowercase letter).
 *
 * @param {*} val
 * @returns {string} alphanumeric string
 */
export default function hash(val) {
  const n = sdbm(mark(val))
  return (
    String.fromCharCode(97 + (n % 26)) +
    (n.toString(36).slice(1, 5) + (n * MAGIC_NUMBER).toString(36).slice(1, 8))
  ).padEnd(12, "0")
}
