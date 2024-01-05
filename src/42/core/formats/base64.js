//! Copyright (c) 2014 Jameson Little. MIT License.
// @src https://github.com/beatgammit/base64-js

/**
 * @file
 * @author Jameson Little
 * @license MIT
 * @source https://github.com/beatgammit/base64-js
 */

import ensureArrayBuffer from "../../fabric/binary/ensureArrayBuffer.js"

const lookup = []
const revLookup = []

const code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
for (let i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup["-".charCodeAt(0)] = 62
revLookup["_".charCodeAt(0)] = 63

function getLens(str) {
  const len = str.length

  if (len % 4 > 0) {
    throw new Error("Invalid string. Length must be a multiple of 4")
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  let validLen = str.indexOf("=")
  if (validLen === -1) validLen = len

  const placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
export function byteLength(str) {
  const lens = getLens(str)
  const validLen = lens[0]
  const placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen
}

/**
 * @param {string} str
 * @returns {ArrayBuffer}
 */
export function base64ToArrayBuffer(str) {
  let tmp
  const lens = getLens(str)
  const validLen = lens[0]
  const placeHoldersLen = lens[1]

  const arr = new Uint8Array(
    ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen,
  )

  let curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  const len = placeHoldersLen > 0 ? validLen - 4 : validLen

  let i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[str.charCodeAt(i)] << 18) |
      (revLookup[str.charCodeAt(i + 1)] << 12) |
      (revLookup[str.charCodeAt(i + 2)] << 6) |
      revLookup[str.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xff
    arr[curByte++] = (tmp >> 8) & 0xff
    arr[curByte++] = tmp & 0xff
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[str.charCodeAt(i)] << 2) |
      (revLookup[str.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xff
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[str.charCodeAt(i)] << 10) |
      (revLookup[str.charCodeAt(i + 1)] << 4) |
      (revLookup[str.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xff
    arr[curByte++] = tmp & 0xff
  }

  return arr.buffer
}

function tripletToBase64(num) {
  return (
    lookup[(num >> 18) & 0x3f] +
    lookup[(num >> 12) & 0x3f] +
    lookup[(num >> 6) & 0x3f] +
    lookup[num & 0x3f]
  )
}

function encodeChunk(uint8, start, end) {
  let str = ""
  for (let i = start; i < end; i += 3) {
    str += tripletToBase64(
      ((uint8[i] << 16) & 0xff_00_00) +
        ((uint8[i + 1] << 8) & 0xff_00) +
        (uint8[i + 2] & 0xff),
    )
  }

  return str
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function base64FromArrayBuffer(buffer) {
  let tmp
  const uint8 = new Uint8Array(buffer)
  const len = uint8.length
  const extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  const maxChunkLength = 16_383 // must be multiple of 3
  let str = ""

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (let i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    str += encodeChunk(
      uint8,
      i,
      i + maxChunkLength > len2 ? len2 : i + maxChunkLength,
    )
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    str += lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + "=="
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    str +=
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3f] +
      lookup[(tmp << 2) & 0x3f] +
      "="
  }

  return str
}

/**
 * @param {string | ArrayBuffer | ArrayBufferView} val
 * @returns {string}
 */
export function base64Encode(val) {
  const buffer = ensureArrayBuffer(val)
  return base64FromArrayBuffer(buffer)
}

/**
 * @param {string} str
 * @param {TextDecoderCommon['encoding'] | { encoding?: TextDecoderCommon['encoding'] }} [options]
 * @returns {string | ArrayBuffer}
 */
export function base64Decode(str, options) {
  const buffer = base64ToArrayBuffer(str)

  if (typeof options === "string") options = { encoding: options }
  if (options?.encoding) {
    return new TextDecoder(options?.encoding).decode(buffer)
  }

  return buffer
}

export const base64 = {
  encode: base64Encode,
  decode: base64Decode,
  toArrayBuffer: base64ToArrayBuffer,
  fromArrayBuffer: base64FromArrayBuffer,
  byteLength,
}

export default base64
