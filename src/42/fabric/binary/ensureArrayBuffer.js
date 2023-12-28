import getType from "../type/any/getType.js"

/**
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
    throw new TypeError(
      `Input must be a string, ArrayBuffer or ArrayBufferView: ${getType(val)}`,
    )
  }

  return buffer
}

export default ensureArrayBuffer
