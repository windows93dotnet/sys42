/* eslint-disable no-loss-of-precision */
import test from "../../../../42/test.js"
import CBOR from "../../../../42/core/formats/cbor.js"

function generateArrayBuffer(data) {
  const ret = new ArrayBuffer(data.length)
  const uintArray = new Uint8Array(ret)
  for (const [i, datum] of data.entries()) {
    uintArray[i] = datum
  }

  return new Uint8Array(data)
}

function hex2arrayBuffer(data) {
  const length = data.length / 2
  const ret = new Uint8Array(length)
  for (let i = 0; i < length; ++i) {
    // eslint-disable-next-line unicorn/prefer-string-slice
    ret[i] = Number.parseInt(data.substr(i * 2, 2), 16)
  }

  return ret.buffer
}

const { task } = test

// prettier-ignore
const testcases = [
  task({title: "PositiveIntegerFix", args: ["00", 0]}),
  task({title: "PositiveIntegerFix", args: ["01", 1]}),
  task({title: "PositiveIntegerFix", args: ["0a", 10]}),
  task({title: "PositiveIntegerFix", args: ["17", 23]}),
  task({title: "PositiveIntegerFix", args: ["1818", 24]}),
  task({title: "PositiveInteger8", args: ["1819", 25]}),
  task({title: "PositiveInteger8", args: ["1864", 100]}),
  task({title: "PositiveInteger16", args: ["1903e8", 1000]}),
  task({title: "PositiveInteger32", args: ["1a000f4240", 1_000_000]}),
  task({title: "PositiveInteger64", args: ["1b000000e8d4a51000", 1_000_000_000_000]}),
  task({title: "PositiveInteger64", args: ["1b001fffffffffffff", 9_007_199_254_740_991]}),
  task({title: "PositiveInteger64", args: ["1b0020000000000000", 9_007_199_254_740_992]}),
  task({title: "PositiveInteger64", args: ["1bffffffffffffffff", 18_446_744_073_709_551_615, true]}),
  task({title: "NegativeIntegerFix", args: ["20", -1]}),
  task({title: "NegativeIntegerFix", args: ["29", -10]}),
  task({title: "NegativeIntegerFix", args: ["37", -24]}),
  task({title: "NegativeInteger8", args: ["3818", -25]}),
  task({title: "NegativeInteger8", args: ["3819", -26]}),
  task({title: "NegativeInteger8", args: ["3863", -100]}),
  task({title: "NegativeInteger16", args: ["3903e7", -1000]}),
  task({title: "NegativeInteger32", args: ["3a000f423f", -1_000_000]}),
  task({title: "NegativeInteger64", args: ["3b000000e8d4a50fff", -1_000_000_000_000]}),
  task({title: "NegativeInteger64", args: ["3b001fffffffffffff", -9_007_199_254_740_992]}),
  task({title: "NegativeInteger64", args: ["3bffffffffffffffff", -18_446_744_073_709_551_616, true]}),
  task({title: "ByteString", args: ["40", generateArrayBuffer([])]}),
  task({title: "Bytestring", args: ["4401020304", generateArrayBuffer([1, 2, 3, 4])]}),
  task({title: "Bytestring", args: ["5f42010243030405ff", generateArrayBuffer([1, 2, 3, 4, 5]), true]}),
  task({title: "String", args: ["60", ""]}),
  task({title: "String", args: ["6161", "a"]}),
  task({title: "String", args: ["6449455446", "IETF"]}),
  task({title: "String", args: ["62225c", '"\\']}),
  task({title: "String (U+00FC)", args: ["62c3bc", "\u00fc"]}),
  task({title: "String (U+6C34)", args: ["63e6b0b4", "\u6c34"]}),
  task({title: "String (U+10151)", args: ["64f0908591", "\ud800\udd51"]}),
  task({title: "String", args: ["7f657374726561646d696e67ff", "streaming", true]}),
  task({title: "Array", args: ["80", []]}),
  task({title: "Array", args: ["826161a161626163", ["a", { b: "c" }]]}),
  task({title: "Array", args: ["826161bf61626163ff", ["a", { b: "c" }], true]}),
  task({title: "Array", args: ["83010203", [1, 2, 3]]}),
  task({title: "Array", args: ["8301820203820405", [1, [2, 3], [4, 5]]]}),
  task({title: "Array", args: ["83018202039f0405ff", [1, [2, 3], [4, 5]], true]}),
  task({title: "Array", args: ["83019f0203ff820405", [1, [2, 3], [4, 5]], true]}),
  task({title: "Array", args: ["98190102030405060708090a0b0c0d0e0f101112131415161718181819", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]]}),
  task({title: "Array", args: ["9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], true]}),
  task({title: "Array", args: ["9f01820203820405ff", [1, [2, 3], [4, 5]], true]}),
  task({title: "Array", args: ["9f018202039f0405ffff", [1, [2, 3], [4, 5]], true]}),
  task({title: "Array", args: ["9fff", [], true]}),
  task({title: "Object", args: ["a0", {}]}),
  task({title: "Object", args: ["a201020304", { 1: 2, 3: 4 }, true]}),
  task({title: "Object", args: ["a26161016162820203", { a: 1, b: [2, 3] }, true]}),
  task({title: "Object", args: ["a56161614161626142616361436164614461656145", { a: "A", b: "B", c: "C", d: "D", e: "E" }, true]}),
  task({title: "Object", args: ["bf61610161629f0203ffff", { a: 1, b: [2, 3] }, true]}),
  task({title: "Object", args: ["bf6346756ef563416d7421ff", { Fun: true, Amt: -2 }, true]}),
  task({title: "Tag Self-describe CBOR 0", args: ["d9d9f700", 0, true]}),
  task({title: "false", args: ["f4", false]}),
  task({title: "true", args: ["f5", true]}),
  task({title: "null", args: ["f6", null]}),
  task({title: "undefined", args: ["f7", undefined]}),
  task({title: "UnassignedSimpleValue 255", args: ["f8ff", undefined, true]}),
  task({title: "Float16", args: ["f90000", 0, true]}),
  task({title: "Float16", args: ["f98000", -0, true]}),
  task({title: "Float16", args: ["f93c00", 1, true]}),
  task({title: "Float16", args: ["f93e00", 1.5, true]}),
  task({title: "Float16", args: ["f97bff", 65_504, true]}),
  task({title: "Float16", args: ["f90001", 5.960_464_477_539_063e-8, true]}),
  task({title: "Float16", args: ["f90400", 0.000_061_035_156_25, true]}),
  task({title: "Float16", args: ["f98001", -5.960_464_477_539_063e-8, true]}),
  task({title: "Float16", args: ["f9c400", -4, true]}),
  task({title: "Float16", args: ["f97c00", Infinity, true]}),
  task({title: "Float16", args: ["f97e00", Number.NaN, true]}),
  task({title: "Float16", args: ["f9fc00", -Infinity, true]}),
  task({title: "Float32", args: ["fa47c35000", 100_000, true]}),
  task({title: "Float32", args: ["fa7f7fffff", 3.402_823_466_385_288_6e+38, true]}),
  task({title: "Float32", args: ["fa7f800000", Infinity, true]}),
  task({title: "Float32", args: ["fa7fc00000", Number.NaN, true]}),
  task({title: "Float32", args: ["faff800000", -Infinity, true]}),
  task({title: "Float64", args: ["fb3ff199999999999a", 1.1]}),
  task({title: "Float64", args: ["fb4340000000000001", 9_007_199_254_740_994]}),
  task({title: "Float64", args: ["fb7e37e43c8800759c", 1e300]}),
  task({title: "Float64", args: ["fbc010666666666666", -4.1]}),
  task({title: "Float64", args: ["fbc340000000000001", -9_007_199_254_740_994]}),
  task({title: "Float64", args: ["fb7ff0000000000000", Infinity]}),
  task({title: "Float64", args: ["fb7ff8000000000000", Number.NaN, true]}),
  task({title: "Float64", args: ["fbfff0000000000000", -Infinity]}),
]

test.tasks(testcases, (test, { title, args }) => {
  const [data, expected, binaryDifference] = args
  test(title, expected, (t) => {
    t.eq(CBOR.decode(hex2arrayBuffer(data)), expected, "Decoding")
    const encoded = CBOR.encode(expected)
    t.eq(CBOR.decode(encoded), expected, "Encoding")
    if (!binaryDifference) {
      let hex = ""
      const uint8Array = new Uint8Array(encoded)
      for (const element of uint8Array) {
        hex += (element < 0x10 ? "0" : "") + element.toString(16)
      }

      t.eq(hex, data, "Encoding (byteMatch)")
    }
  })
})

test("big Array", (t) => {
  const value = new Array(0x1_00_01)
  for (let i = 0; i < value.length; ++i) value[i] = i
  t.eq(CBOR.decode(CBOR.encode(value)), value)
})

test("big String", (t) => {
  let value = ""
  for (let i = 0; i < 126_000; ++i) {
    value += Math.floor(i % 10).toString()
  }

  t.eq(CBOR.decode(CBOR.encode(value)), value)
})

test("remaining Bytes", (t) => {
  t.throws(
    () => CBOR.decode(new ArrayBuffer(2)), //
    "Remaining bytes",
  )
})

test("invalid length encoding", (t) => {
  t.throws(
    () => CBOR.decode(hex2arrayBuffer("1e")), //
    "Invalid length encoding",
  )
})

test("invalid length", (t) => {
  t.throws(
    () => CBOR.decode(hex2arrayBuffer("1f")), //
    "Invalid length",
  )
})

test("invalid indefinite length element type", (t) => {
  t.throws(
    () => CBOR.decode(hex2arrayBuffer("5f00")),
    "Invalid indefinite length element",
  )
})

test("invalid indefinite length element length", (t) => {
  t.throws(
    () => CBOR.decode(hex2arrayBuffer("5f5f")),
    "Invalid indefinite length element",
  )
})

test("tagging", (t) => {
  function TaggedValue(value, tag) {
    this.value = value
    this.tag = tag
  }

  function SimpleValue(value) {
    this.value = value
  }

  const arrayBuffer = hex2arrayBuffer("83d81203d9456708f8f0")
  const decoded = CBOR.decode(
    arrayBuffer,
    (value, tag) => new TaggedValue(value, tag),
    (value) => new SimpleValue(value),
  )

  t.true(decoded[0] instanceof TaggedValue, "first item is a TaggedValue")
  t.eq(decoded[0].value, 3, "first item value")
  t.eq(decoded[0].tag, 0x12, "first item tag")
  t.true(decoded[1] instanceof TaggedValue, "second item is a TaggedValue")
  t.eq(decoded[1].value, 8, "second item value")
  t.eq(decoded[1].tag, 0x45_67, "second item tag")
  t.true(decoded[2] instanceof SimpleValue, "third item is a SimpleValue")
  t.eq(decoded[2].value, 0xf0, "third item tag")
})

test("large object", async (t) => {
  t.timeout(1000)

  const [buffer, json] = await Promise.all([
    t.utils.load.arrayBuffer("/tests/fixtures/formats/cbor/large-object.cbor"),
    t.utils.load.json("/tests/fixtures/formats/cbor/large-object.json"),
  ])

  const obj = CBOR.decode(buffer)
  t.eq(obj, json)
  t.eq(CBOR.encode(obj), buffer)
})
