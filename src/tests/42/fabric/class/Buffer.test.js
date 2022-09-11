import Buffer from "../../../../42/fabric/class/Buffer.js"
import test from "../../../../42/test.js"

function stringToBuffer(str) {
  return new TextEncoder().encode(str).buffer
}

test("Buffer", (t) => {
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

test("Buffer.write", (t) => {
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

test("Buffer.read", (t) => {
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

test("Buffer.write", "auto grow", (t) => {
  const buf = new Buffer()

  t.eq(buf.value, new ArrayBuffer())

  const data = new Uint8Array(0x01_00_00 + 1)
  data.fill(1)

  buf.write(data)

  t.eq(buf.value, data.buffer)
})

test.only("Buffer.writeInt16", (t) => {
  t.eq(
    new Uint8Array([0, 42, 0, 9]).buffer,
    new Uint8Array([0, 42, 0, 42]).buffer
  )
})

test("Buffer.writeInt16", (t) => {
  const buf = new Buffer()

  buf.writeInt16(42)
  t.is(buf.view.getInt16(0), 42)
  t.is(buf.readInt16(), 42)

  t.eq(buf.value, new Uint8Array([0, 42]).buffer)

  buf.writeInt16(12)
  t.eq(buf.value, new Uint8Array([0, 42, 0, 12]).buffer)
})

test("Buffer.writeBigInt64", (t) => {
  const buf = new Buffer()

  buf.writeBigInt64(3n)
  t.is(buf.view.getBigInt64(0), 3n)
  t.is(buf.readBigInt64(), 3n)

  t.eq(buf.value, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0x03]).buffer)
})
