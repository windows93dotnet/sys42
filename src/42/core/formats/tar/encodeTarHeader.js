/* spell-checker: disable */

//! Copyright (c) 2014 Mathias Buus. MIT License.
// @src https://github.com/mafintosh/tar-stream/blob/master/headers.js

import Buffer from "../../../fabric/binary/Buffer.js"
import { countBytes } from "../../../fabric/type/string/count.js"

const encoder = new TextEncoder()

const ZEROS = "0000000000000000000"
const SEVENS = "7777777777777777777"
const ZERO_OFFSET = "0".charCodeAt(0)
const USTAR_MAGIC = encoder.encode("ustar\x00")
const USTAR_VER = encoder.encode("00")
const MASK = 0o7777
const MAGIC_OFFSET = 257
const VERSION_OFFSET = 263

function toTypeflag(flag) {
  // prettier-ignore
  switch (flag) {
    case "file": return 0
    case "link": return 1
    case "symlink": return 2
    case "character-device": return 3
    case "block-device": return 4
    case "directory": return 5
    case "fifo": return 6
    case "contiguous-file": return 7
    case "pax-header": return 72
    default: return 0
  }
}

function cksum(block) {
  let sum = 8 * 32
  for (let i = 0; i < 148; i++) sum += block.peekByte(i)
  for (let j = 156; j < 512; j++) sum += block.peekByte(j)
  return sum
}

function encodeOct(val, n) {
  val = val.toString(8)
  if (val.length > n) return SEVENS.slice(0, n) + " "
  return ZEROS.slice(0, n - val.length) + val + " "
}

function addLength(str) {
  const len = countBytes(str)
  let digits = Math.floor(Math.log(len) / Math.log(10)) + 1
  if (len + digits >= 10 ** digits) digits++
  return len + digits + str
}

export function encodePax(opts) {
  // TODO: encode more stuff in pax
  let result = ""
  if (opts.name) result += addLength(` path=${opts.name}\n`)
  if (opts.linkname) result += addLength(` linkpath=${opts.linkname}\n`)
  const { pax } = opts
  if (pax) {
    for (const key in pax) {
      if (Object.hasOwn(pax, key)) result += addLength(` ${key}=${pax[key]}\n`)
    }
  }

  return encoder.encode(result)
}

export function encodeTarHeader(opts) {
  const buf = new Buffer(512)
  let { name } = opts
  let prefix = ""

  if (opts.typeflag === 5 && name.at(-1) !== "/") name += "/"
  if (countBytes(name) !== name.length) return null // utf-8

  while (countBytes(name) > 100) {
    const i = name.indexOf("/")
    if (i === -1) return null
    prefix += prefix ? "/" + name.slice(0, i) : name.slice(0, i)
    name = name.slice(i + 1)
  }

  if (countBytes(name) > 100 || countBytes(prefix) > 155) {
    return null
  }

  if (opts.linkname && countBytes(opts.linkname) > 100) return null

  buf.writeText(name, 0)
  buf.writeText(encodeOct(opts.mode & MASK, 6), 100)
  buf.writeText(encodeOct(opts.uid, 6), 108)
  buf.writeText(encodeOct(opts.gid, 6), 116)
  buf.writeText(encodeOct(opts.size, 11), 124)
  buf.writeText(encodeOct((opts.mtime / 1000) | 0, 11), 136)

  buf.writeByte(ZERO_OFFSET + toTypeflag(opts.type), 156)

  if (opts.linkname) buf.writeText(opts.linkname, 157)

  buf.write(USTAR_MAGIC, MAGIC_OFFSET)
  buf.write(USTAR_VER, VERSION_OFFSET)
  if (opts.uname) buf.writeText(opts.uname, 265)
  if (opts.gname) buf.writeText(opts.gname, 297)
  buf.writeText(encodeOct(opts.devmajor || 0, 6), 329)
  buf.writeText(encodeOct(opts.devminor || 0, 6), 337)

  if (prefix) buf.writeText(prefix, 345)

  buf.writeText(encodeOct(cksum(buf), 6), 148)

  return buf.toUint8Array()
}

export default encodeTarHeader
