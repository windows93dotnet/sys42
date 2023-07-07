/* spell-checker: disable */

//! Copyright (c) 2014 Mathias Buus. MIT License.
// @src https://github.com/mafintosh/tar-stream/blob/master/headers.js

import Buffer from "../../../fabric/binary/Buffer.js"

const encoder = new TextEncoder()

const ZERO_OFFSET = "0".charCodeAt(0)
const USTAR_MAGIC = encoder.encode("ustar\x00")
const GNU_MAGIC = encoder.encode("ustar\x20")
const GNU_VER = encoder.encode("\x20\x00")
const MAGIC_OFFSET = 257
const VERSION_OFFSET = 263

function toType(flag) {
  // prettier-ignore
  switch (flag) {
    case 0: return "file"
    case 1: return "link"
    case 2: return "symlink"
    case 3: return "character-device"
    case 4: return "block-device"
    case 5: return "directory"
    case 6: return "fifo"
    case 7: return "contiguous-file"
    case 72: return "pax-header"
    case 55: return "pax-global-header"
    case 27: return "gnu-long-link-path"
    case 28:
    case 30: return "gnu-long-path"
    default: return null
  }
}

function cksum(block) {
  let sum = 8 * 32
  for (let i = 0; i < 148; i++) sum += block[i]
  for (let j = 156; j < 512; j++) sum += block[j]
  return sum
}

function toString(bytes, encoding) {
  return new TextDecoder(encoding).decode(bytes)
}

function clamp(index, len, defaultValue) {
  if (typeof index !== "number") return defaultValue
  index = ~~index // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function indexOf(block, num, offset, end) {
  for (; offset < end; offset++) {
    if (block[offset] === num) return offset
  }

  return end
}

function parse256(buf) {
  // first byte MUST be either 80 or FF
  // 80 for positive, FF for 2's comp
  let positive
  if (buf[0] === 0x80) positive = true
  else if (buf[0] === 0xff) positive = false
  else return null

  // build up a base-256 tuple from the least sig to the highest
  const tuple = []
  for (let i = buf.length - 1; i > 0; i--) {
    const byte = buf[i]
    if (positive) tuple.push(byte)
    else tuple.push(0xff - byte)
  }

  let sum = 0
  const l = tuple.length
  for (let i = 0; i < l; i++) {
    sum += tuple[i] * 256 ** i
  }

  return positive ? sum : -1 * sum
}

const decodeOct = function (val, offset, length) {
  val = val.slice(offset, offset + length)
  offset = 0

  // If prefixed with 0x80 then parse as a base-256 integer
  if (val[offset] & 0x80) {
    return parse256(val)
  }

  // Older versions of tar can prefix with spaces
  while (offset < val.length && val[offset] === 32) offset++
  const end = clamp(
    indexOf(val, 32, offset, val.length),
    val.length,
    val.length,
  )
  while (offset < end && val[offset] === 0) offset++
  if (end === offset) return 0
  return Number.parseInt(toString(val.slice(offset, end)), 8)
}

const decodeStr = function (val, offset, length, encoding) {
  return toString(
    val.slice(offset, indexOf(val, 0, offset, offset + length)),
    encoding,
  )
}

export function decodeLongPath(buf, encoding) {
  return decodeStr(buf, 0, buf.length, encoding)
}

export function decodePax(buf) {
  const result = {}

  while (buf.length > 0) {
    let i = 0
    while (i < buf.length && buf[i] !== 32) i++
    const len = Number.parseInt(toString(buf.slice(0, i)), 10)
    if (!len) return result

    const b = toString(buf.slice(i + 1, len - 1))
    const keyIndex = b.indexOf("=")
    if (keyIndex === -1) return result
    result[b.slice(0, keyIndex)] = b.slice(keyIndex + 1)

    buf = buf.slice(len)
  }

  return result
}

export function decodeTarHeader(
  buf,
  { filenameEncoding, allowUnknownFormat } = {},
) {
  let typeflag = buf[156] === 0 ? 0 : buf[156] - ZERO_OFFSET

  let name = decodeStr(buf, 0, 100, filenameEncoding)
  const mode = decodeOct(buf, 100, 8)
  const uid = decodeOct(buf, 108, 8)
  const gid = decodeOct(buf, 116, 8)
  const size = decodeOct(buf, 124, 12)
  const mtime = decodeOct(buf, 136, 12) * 1000
  const type = toType(typeflag)
  const linkname =
    buf[157] === 0 ? null : decodeStr(buf, 157, 100, filenameEncoding)
  const uname = decodeStr(buf, 265, 32)
  const gname = decodeStr(buf, 297, 32)
  const devmajor = decodeOct(buf, 329, 8)
  const devminor = decodeOct(buf, 337, 8)

  const c = cksum(buf)

  // checksum is still initial value if header was null.
  if (c === 8 * 32) return null

  // valid checksum
  if (c !== decodeOct(buf, 148, 8)) {
    throw new Error(
      "Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?",
    )
  }

  if (
    Buffer.equals(USTAR_MAGIC, buf.subarray(MAGIC_OFFSET, MAGIC_OFFSET + 6))
  ) {
    // ustar (posix) format.
    // prepend prefix, if present.
    if (buf[345]) name = decodeStr(buf, 345, 155, filenameEncoding) + "/" + name
  } else if (
    Buffer.equals(GNU_MAGIC, buf.subarray(MAGIC_OFFSET, MAGIC_OFFSET + 6)) &&
    Buffer.equals(GNU_VER, buf.subarray(VERSION_OFFSET, VERSION_OFFSET + 2))
  ) {
    // 'gnu'/'oldgnu' format. Similar to ustar, but has support for incremental and
    // multi-volume tarballs.
  } else if (!allowUnknownFormat) {
    throw new Error("Invalid tar header: unknown format.")
  }

  // to support old tar versions that use trailing / to indicate dirs
  if (typeflag === 0 && name && name.at(-1) === "/") typeflag = 5

  return {
    name,
    mode,
    uid,
    gid,
    size,
    mtime,
    type,
    linkname,
    uname,
    gname,
    devmajor,
    devminor,
  }
}

export default decodeTarHeader
