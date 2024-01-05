/**
 * Convert a value to an array.\
 * Specifying `null` or `undefined` results in an empty array.
 *
 * @author Sindre Sorhus [sindresorhus@gmail.com](mailto:sindresorhus@gmail.com) (https://sindresorhus.com)
 * @license MIT
 * @source https://github.com/sindresorhus/arrify
 *
 * @param {any} val
 * @returns {any[]}
 */
export function arrify(val) {
  return val == null
    ? []
    : Array.isArray(val)
      ? val
      : typeof val === "string"
        ? [val]
        : typeof val[Symbol.iterator] === "function"
          ? [...val]
          : [val]
}

export default arrify
