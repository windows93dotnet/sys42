import test from "../../../../42/test.js"
import base64 from "../../../../42/core/formats/base64.js"

const checks = ["a", "aa", "aaa", "hi", "hi!", "hi!!", "sup", "sup?", "sup?!"]

test("convert to base64 and back", async (t) => {
  t.plan(checks.length * 2)

  for (const check of checks) {
    const b64Str = await base64.encode(check)
    const str = await base64.decode(b64Str, { output: "string" })

    t.is(str, check, "Checked " + check)
    t.equal(
      base64.byteLength(b64Str),
      base64.toArrayBuffer(b64Str).byteLength,
      "Checked length for " + check
    )
  }
})

const data = [
  [[0, 0, 0], "AAAA"],
  [[0, 0, 1], "AAAB"],
  [[0, 1, -1], "AAH/"],
  [[1, 1, 1], "AQEB"],
  [[0, -73, 23], "ALcX"],
]

test("convert known data to string", (t) => {
  for (const datum of data) {
    const bytes = datum[0]
    const expected = datum[1]
    const actual = base64.fromArrayBuffer(bytes)
    t.is(actual, expected, "Ensure that " + bytes + " serialise to " + expected)
  }
})

test("convert known data from string", (t) => {
  for (const datum of data) {
    const expected = new Uint8Array(datum[0]).buffer
    const string = datum[1]
    const actual = base64.toArrayBuffer(string)
    t.eq(
      actual,
      expected,
      "Ensure that " + string + " deserialise to " + expected
    )
    const length = base64.byteLength(string)
    t.is(
      length,
      expected.byteLength,
      "Ensure that " + string + " has byte lentgh of " + expected.byteLength
    )
  }
})

test("decode url-safe style base64 strings", async (t) => {
  t.is(await base64.encode("//++/++/++//"), "Ly8rKy8rKy8rKy8v")
  t.is(await base64.encode("__--_--_--__"), "X18tLV8tLV8tLV9f")
  t.is(
    await base64.decode("Ly8rKy8rKy8rKy8v", { output: "string" }),
    "//++/++/++//"
  )
  t.is(
    await base64.decode("X18tLV8tLV8tLV9f", { output: "string" }),
    "__--_--_--__"
  )

  const expected = new Uint8Array([
    0xff, 0xff, 0xbe, 0xff, 0xef, 0xbf, 0xfb, 0xef, 0xff,
  ]).buffer

  let str = "//++/++/++//"
  let actual = base64.toArrayBuffer(str)
  t.eq(actual, expected)

  t.is(base64.byteLength(str), actual.byteLength)

  str = "__--_--_--__"
  actual = base64.toArrayBuffer(str)
  t.eq(actual, expected)

  t.is(base64.byteLength(str), actual.byteLength)
})

test("padding bytes found inside base64 string", async (t) => {
  // See https://github.com/beatgammit/base64-js/issues/42
  const str = "SQ==QU0="
  // console.log(await base64.decode("SQ==QU0=", { output: "string" }))
  t.eq(base64.toArrayBuffer(str), new Uint8Array([73]).buffer)
  t.is(base64.byteLength(str), 1)
})

test.skip("convert big data to base64", async (t) => {
  t.timeout(4000)
  const big = new Uint8Array(64 * 1024 * 1024)
  for (let i = 0, { length } = big; i < length; ++i) {
    big[i] = i % 256
  }

  const str = await base64.encode(big)
  const buffer = await base64.decode(str)
  const arr = new Uint8Array(buffer)
  t.eq(arr, big)
  t.is(base64.byteLength(str), arr.length)
})
