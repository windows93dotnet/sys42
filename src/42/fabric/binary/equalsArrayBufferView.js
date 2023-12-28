//! Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// @src https://deno.land/std@0.179.0/bytes/equals.ts?source

/**
 * Check whether binary arrays are equal to each other using 8-bit comparisons.
 * @private
 * @param {ArrayBufferView} a first array to check equality
 * @param {ArrayBufferView} b second array to check equality
 * @returns {boolean}
 */
function equalsNaive(a, b) {
  for (let i = 0, l = a.byteLength; i < l; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}

/**
 * Check whether binary arrays are equal to each other using 32-bit comparisons.
 * @private
 * @param {ArrayBufferView} a first array to check equality
 * @param {ArrayBufferView} b second array to check equality
 * @returns {boolean}
 */
function equals32Bit(a, b) {
  const len = a.byteLength
  const compressable = Math.floor(len / 4)
  const compressedA = new Uint32Array(a.buffer, 0, compressable)
  const compressedB = new Uint32Array(b.buffer, 0, compressable)
  for (let i = compressable * 4; i < len; i++) {
    if (a[i] !== b[i]) return false
  }

  for (let i = 0, l = compressedA.byteLength; i < l; i++) {
    if (compressedA[i] !== compressedB[i]) return false
  }

  return true
}

/**
 * Check whether binary arrays are equal to each other.
 * @param {ArrayBufferView} a first array to check equality
 * @param {ArrayBufferView} b second array to check equality
 * @returns {boolean}
 */
export function equalsArrayBufferView(a, b) {
  if (a.byteLength !== b.byteLength) return false
  return a.byteLength < 1000 ? equalsNaive(a, b) : equals32Bit(a, b)
}

export default equalsArrayBufferView
