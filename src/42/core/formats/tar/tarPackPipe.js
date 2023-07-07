import Buffer from "../../../fabric/binary/Buffer.js"
import inNode from "../../env/runtime/inNode.js"
import defer from "../../../fabric/type/promise/defer.js"
import { encodeTarHeader, encodePax } from "./encodeTarHeader.js"

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

function writeHeader(writer, header) {
  if (!header.pax) {
    const buf = encodeTarHeader(normalizeHeader(header))
    if (buf) {
      writer.write(buf)
      return
    }
  }

  const paxHeader = encodePax({
    name: header.name,
    linkname: header.linkname,
    pax: header.pax,
  })

  const newHeader = {
    ...header,
    name: "PaxHeader",
    size: paxHeader.length,
    type: "pax-header",
    linkname: header.linkname && "PaxHeader",
  }

  writer.write(encodeTarHeader(normalizeHeader(newHeader)))
  writer.write(paxHeader)
  overflow(writer, paxHeader.length)

  newHeader.size = header.size
  newHeader.type = header.type
  writer.write(encodeTarHeader(newHeader))
}

export function tarPackPipe(options) {
  const ts = new TransformStream()

  let writer = ts.writable.getWriter()
  const queue = []

  ts.add = async function (header, file) {
    const prev = queue.at(-1)
    const busy = defer()
    queue.push(busy)
    await prev

    if (globalThis.File && header instanceof File) {
      file = header
      header = {}
    }

    file ??= header.file

    if (globalThis.File && file instanceof File) {
      header.name ??= file.name
      header.size ??= file.size
      header.mtime ??= file.lastModified
      writeHeader(writer, header)
      writer.releaseLock()
      await file.stream().pipeTo(ts.writable, { preventClose: true })
      writer = ts.writable.getWriter()
      overflow(writer, header.size)
    } else if (file instanceof ReadableStream) {
      writeHeader(writer, header)
      writer.releaseLock()
      await file.pipeTo(ts.writable, { preventClose: true })
      writer = ts.writable.getWriter()
      overflow(writer, header.size)
    } else {
      const buf = Buffer.from(file)
      header.size ??= buf.length
      writeHeader(writer, header)
      writer.write(buf.toUint8Array())
      overflow(writer, header.size)
    }

    busy.resolve()
  }

  ts.stream = function () {
    queueMicrotask(async () => {
      await Promise.all(queue)
      await writer.write(END_OF_TAR)
      writer.close()
    })

    return ts.readable
  }

  let { readable } = ts

  if (inNode) {
    readable = readable.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(new Uint8Array(chunk))
        },
      }),
    )
  }

  if (options?.gzip) {
    readable = readable.pipeThrough(new CompressionStream("gzip"))
  }

  Object.defineProperty(ts, "readable", { value: readable })

  return ts
}

export default tarPackPipe
