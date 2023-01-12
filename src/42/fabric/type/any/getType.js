/**
 * Returns the input type,
 * like the `typeof` operator but with `null` and `array` support.
 *
 * @param {*} val
 * @returns {string}
 */
export default function getType(val) {
  if (Array.isArray(val)) return "array"
  if (val === null) return "null"
  return typeof val
}
