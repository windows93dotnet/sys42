import getType from "../type/any/getType.js"

/**
 * Returns an `ArrayBuffer` from the input value if it's a `string`, an `ArrayBuffer` or an `ArrayBufferView`.\
 * Throws a `TypeError` otherwise.
 *
 * @param {string | ArrayBuffer | ArrayBufferView} val
 * @returns {ArrayBuffer}
 */
export function ensureArrayBuffer(val) {
  const buffer =
    val instanceof ArrayBuffer
      ? val
      : typeof val === "string"
        ? new TextEncoder().encode(val)
        : val?.buffer

  if (!buffer) {
    const type = getType(val)
    throw new TypeError(
      `Input value must be a string, ArrayBuffer or ArrayBufferView: ${type}`,
    )
  }

  return buffer
}

export default ensureArrayBuffer
