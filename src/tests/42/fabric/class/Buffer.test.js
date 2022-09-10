import Buffer from "../../../../42/fabric/class/Buffer.js"
import test from "../../../../42/test.js"

function stringToBuffer(str) {
  return new TextEncoder().encode(str).buffer
}

test("Buffer", (t) => {
  const buf = new Buffer()

  t.is(buf.length, 0)
  t.is(buf.byteLength, 0)

  t.is(buf[0], 0)
  t.is(buf[1], 0)
  t.is(buf[999], 0)
  t.is(buf[0x00_ff_ff], 0)

  // outside of first memory page
  t.is(buf[0x01_00_00], undefined)
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
})

test("Buffer.write", "page 2", (t) => {
  const buf = new Buffer()

  t.eq(buf.value, new ArrayBuffer())

  const data = new Uint8Array(0x01_00_00 + 1)
  data.fill(1)

  buf.write(data)

  t.eq(buf.value, data.buffer)
})

// test("DataView prototype", (t) => {
//   const buf = new Buffer()

//   buf.setInt16(1, 42)
//   t.is(buf.getInt16(1), 42)

//   t.eq(buf.buffer)

//   // buf.setBigInt64(0, 3n)
//   // t.is(buf.getBigInt64(0), 3n)

//   // t.eq(buf.dataView.buffer)
// })
