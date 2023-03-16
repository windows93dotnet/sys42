import headers from "./headers.js"
import Buffer from "../../../fabric/binary/Buffer.js"

const END_OF_TAR = new Uint8Array(1024)

const overflow = function (writer, size) {
  size &= 511
  if (size) writer.write(END_OF_TAR.slice(0, 512 - size))
}

export function rsTarPack() {
  const ts = new TransformStream()

  const writer = ts.writable.getWriter()

  ts.entry = function (header, file) {
    const buf = Buffer.from(file)
    header.size ??= buf.length
    writer.write(headers.encode(header))
    writer.write(buf)
    overflow(writer, header.size)
  }

  ts.finalize = function () {
    writer.write(END_OF_TAR)
    writer.close()
  }

  return ts
}

export default rsTarPack
