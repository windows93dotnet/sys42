/**
 * Returns the input type,
 * like the `typeof` operator but with `null` and `array` support.
 *
 * @param {*} val
 * @returns {string}
 */
export default function getType(val) {
  if (val === null) return "null"
  if (Array.isArray(val)) return "array"
  return typeof val
}
