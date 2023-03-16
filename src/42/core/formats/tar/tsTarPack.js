import Buffer from "../../../fabric/binary/Buffer.js"
import defer from "../../../fabric/type/promise/defer.js"
import { encodeTarHeader } from "./encodeTarHeader.js"

const END_OF_TAR = new Uint8Array(1024)

const S_IFMT = 0xf0_00
const S_IFBLK = 0x60_00
const S_IFCHR = 0x20_00
const S_IFDIR = 0x40_00
const S_IFIFO = 0x10_00
const S_IFLNK = 0xa0_00

const overflow = function (writer, size) {
  size &= 511
  if (size) return writer.write(END_OF_TAR.slice(0, 512 - size))
}

function modeToType(mode) {
  // prettier-ignore
  switch (mode & S_IFMT) {
    case S_IFBLK: return "block-device"
    case S_IFCHR: return "character-device"
    case S_IFDIR: return "directory"
    case S_IFIFO: return "fifo"
    case S_IFLNK: return "symlink"
    default: return "file"
  }
}

function normalizeHeader(header) {
  if (header.size === undefined || header.type === "symlink") header.size = 0
  header.type ??= modeToType(header.mode)
  header.mode ??= header.type === "directory" ? 0o755 : 0o644
  header.uid ??= 0
  header.gid ??= 0
  header.mtime ??= Date.now()
  return header
}

export function tsTarPack() {
  const ts = new TransformStream()

  let writer = ts.writable.getWriter()
  let busy

  ts.add = async function (header, file) {
    await busy
    busy = defer()

    if (header instanceof File) {
      file = header
      header = {}
    }

    if (file instanceof File) {
      header.name ??= file.name
      header.size ??= file.size
      header.mtime ??= file.lastModified
      writer.write(encodeTarHeader(normalizeHeader(header)))
      writer.releaseLock()
      await file.stream().pipeTo(ts.writable, { preventClose: true })
      writer = ts.writable.getWriter()
      overflow(writer, header.size)
    } else {
      const buf = Buffer.from(file)
      header.size ??= buf.length
      writer.write(encodeTarHeader(normalizeHeader(header)))
      writer.write(buf)
      overflow(writer, header.size)
    }

    busy.resolve()
  }

  ts.stream = function () {
    queueMicrotask(async () => {
      await 0
      await busy
      writer.write(END_OF_TAR)
      writer.close()
    })
    return ts.readable
  }

  return ts
}

export default tsTarPack
