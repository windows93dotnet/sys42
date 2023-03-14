import Buffer from "../../../../42/fabric/binary/Buffer.js"
import test from "../../../../42/test.js"

function stringToBuffer(str) {
  return new TextEncoder().encode(str).buffer
}

test("BinaryData", (t) => {
  const buf = new Buffer()

  t.is(buf.length, 0)

  t.is(buf.at(-1), 0)
  t.is(buf.at(0), 0)
  t.is(buf.at(1), 0)
  t.is(buf.at(999), 0)
  t.is(buf.at(0x00_ff_ff), 0)

  // outside of first memory page
  t.is(buf.at(0x01_00_00), undefined)

  buf.write("hello")
  t.is(String.fromCharCode(buf.at(0)), "h")
  t.is(String.fromCharCode(buf.at(-1)), "o")
})

test("BinaryData.read", (t) => {
  const buf = new Buffer()
  buf.write("hello world")
  t.is(buf.read(), "hello world")
  buf.offset = 0

  t.is(buf.read(1), "h")
  t.is(buf.read(1), "e")
  t.is(buf.read(2, 0), "he")
  t.is(buf.read(2), "ll")
  t.is(buf.read(), "o world")
})

test("BinaryData.write", (t) => {
  const buf = new Buffer()
  t.eq(buf.value, new ArrayBuffer())

  buf.write("hello")
  t.eq(buf.value, stringToBuffer("hello"))

  buf.write(" world")
  t.eq(buf.value, stringToBuffer("hello world"))

  buf.write(stringToBuffer("!!!"))
  t.eq(buf.value, stringToBuffer("hello world!!!"))

  buf.write(stringToBuffer("yo yo"), 0)
  t.eq(buf.value, stringToBuffer("yo yo world!!!"))

  buf.write(stringToBuffer("lorem ipsum dolor"), 0)
  t.eq(buf.value, stringToBuffer("lorem ipsum dolor"))
})

test("BinaryData.write", "auto grow", (t) => {
  const buf = new Buffer()

  t.eq(buf.value, new ArrayBuffer())

  const data = new Uint8Array(0x01_00_00 + 1)
  data.fill(1)

  buf.write(data)

  t.eq(buf.value, data.buffer)
})

test("BinaryData.writeUint16", (t) => {
  const buf = new Buffer()

  buf.writeUint16(42)
  t.is(buf.view.getUint16(0), 42)
  t.eq(buf.value, new Uint8Array([0, 42]).buffer)

  buf.writeUint16(256)
  t.is(buf.view.getUint16(2), 256)
  t.eq(buf.value, new Uint8Array([0, 42, 1, 0]).buffer)

  t.is(buf.readUint16(), 42)
  t.is(buf.readUint16(), 256)

  t.eq(buf.toUint16Array(), new Uint16Array([42, 256]))
})

test("BinaryData.writeBigInt64", (t) => {
  const buf = new Buffer()

  buf.writeBigInt64(42n)
  t.is(buf.view.getBigInt64(0), 42n)

  t.eq(buf.value, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 42]).buffer)

  buf.writeBigInt64(9_007_199_254_740_991n)
  t.is(buf.view.getBigInt64(8), 9_007_199_254_740_991n)

  t.eq(
    buf.value,
    // prettier-ignore
    new Uint8Array([
      0, 0, 0, 0,  0, 0, 0, 42, //
      0, 0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    ]).buffer
  )

  buf.writeBigInt64(9_007_199_254_740_992n)
  t.is(buf.view.getBigInt64(16), 9_007_199_254_740_992n)

  t.eq(
    buf.value,
    // prettier-ignore
    new Uint8Array([
      0, 0, 0, 0,  0, 0, 0, 42, //
      0, 0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0, 0x20, 0, 0, 0, 0, 0, 0,
    ]).buffer
  )

  t.is(buf.readBigInt64(), 42n)
  t.is(buf.readBigInt64(), 9_007_199_254_740_991n)
  t.is(buf.readBigInt64(), 9_007_199_254_740_992n)

  t.eq(
    buf.toBigInt64Array(),
    new BigInt64Array([42n, 9_007_199_254_740_991n, 9_007_199_254_740_992n])
  )
})
