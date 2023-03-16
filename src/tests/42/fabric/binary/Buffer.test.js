import Buffer from "../../../../42/fabric/binary/Buffer.js"
import test from "../../../../42/test.js"

function stringToBuffer(str) {
  return new TextEncoder().encode(str).buffer
}

test("Buffer[Symbol.iterator]", async (t) => {
  let str = ""
  for (const byte of Buffer.from("hello world")) {
    str += String.fromCharCode(byte)
  }

  t.is(str, "hello world")
})

test("Buffer.toString", async (t) => {
  const buf = Buffer.from("hello world")
  const file = new File([buf], "hello.txt")
  t.is(await file.text(), "hello world")
})

test("Buffer.at", (t) => {
  const buf = new Buffer()

  t.is(buf.length, 0)

  t.is(buf.at(0), undefined)
  t.is(buf.at(-1), undefined)
  t.is(buf.at(1), undefined)

  t.is(buf.at(0x00_ff_ff), undefined)
  // outside of first memory page
  t.is(buf.at(0x01_00_00), undefined)

  buf.writeText("hello")
  t.is(String.fromCharCode(buf.at(0)), "h")
  t.is(String.fromCharCode(buf.at(-1)), "o")
  t.is(String.fromCharCode(buf.at(1)), "e")
  t.is(String.fromCharCode(buf.at(4)), "o")
  t.is(buf.at(5), undefined)
})

test("Buffer", "text stream", (t) => {
  const str = "😋" // \ud83d\ude0b
  const bytes = new TextEncoder().encode(str)
  const buf = Buffer.from(bytes)
  t.is(buf.peekText(4), "😋")
  t.is(buf.peekText(4, 0, "ascii"), "\xf0\u0178\u02dc\u2039")
  t.is(buf.peekText(1, 0), "�")
  t.is(buf.peekText(1, 1), "�")
  t.is(buf.peekText(1, 2), "�")
  t.is(buf.peekText(1, 3), "�")
  t.is(buf.peekText(1, 4), "\x00")

  t.is(buf.readText(1), "")
  t.is(buf.readText(1), "")
  t.is(buf.readText(1), "")
  t.is(buf.readText(1), "😋")
  t.is(buf.readText(1), "\x00")

  buf.go(0)

  t.is(buf.readText(1, 0), "")
  t.is(buf.readText(1, 1), "")
  t.is(buf.readText(1, 0), "") // reset decoder stream position
  t.is(buf.readText(1, 1), "")
  t.is(buf.readText(1, 2), "")
  t.is(buf.readText(1, 3), "😋")
  t.is(buf.readText(1, 4), "\x00")
})

test("Buffer.slice & Buffer.subarray", (t) => {
  const buf = new Buffer()

  buf.writeText("hello")

  const a = buf.slice(2, 4)

  t.eq(a, new Uint8Array([0x6c, 0x6c]))
  t.eq(buf.peekText(), "hello")

  a[0] = 0x6b

  t.eq(buf.peekText(), "hello")

  const b = buf.subarray(2, 4)

  t.eq(b, new Uint8Array([0x6c, 0x6c]))
  t.eq(buf.peekText(), "hello")

  b[0] = 0x6b

  t.eq(buf.peekText(), "heklo")
})

test("Buffer.read", (t) => {
  const buf = new Buffer()
  buf.writeText("hello world")
  t.is(buf.readText(), "hello world")
  buf.offset = 0

  t.is(buf.readText(1), "h")
  t.is(buf.readText(1), "e")
  t.is(buf.readText(2, 0), "he")
  t.is(buf.readText(2), "ll")
  t.is(buf.readText(), "o world")
})

test("Buffer.write", (t) => {
  const buf = new Buffer()
  t.eq(buf.value, new ArrayBuffer())

  buf.writeText("hello")
  t.eq(buf.value, stringToBuffer("hello"))

  buf.writeText(" world")
  t.eq(buf.value, stringToBuffer("hello world"))

  buf.write(stringToBuffer("!!!"))
  t.eq(buf.value, stringToBuffer("hello world!!!"))

  buf.write(stringToBuffer("yo yo"), 0)
  t.eq(buf.value, stringToBuffer("yo yo world!!!"))

  buf.write(stringToBuffer("lorem ipsum dolor"), 0)
  t.eq(buf.value, stringToBuffer("lorem ipsum dolor"))
})

test("Buffer.write", "auto grow", (t) => {
  const buf = new Buffer()

  t.eq(buf.value, new ArrayBuffer())

  const data = new Uint8Array(0x01_00_00 + 1)
  data.fill(1)

  buf.write(data)

  t.eq(buf.value, data.buffer)
})

test("Buffer.writeUint16", (t) => {
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

test("Buffer.writeBigInt64", (t) => {
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
