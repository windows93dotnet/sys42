// @thanks https://github.com/mkxml/fileSize-calculator/blob/master/test/test.js

import test from "../../../../../42/test.js"
import fileSize from "../../../../../42/fabric/type/file/fileSize.js"

test("IEC / SI", (t) => {
  // IEC
  t.is(fileSize(0), "0 B")
  t.is(fileSize(1), "1 B")
  t.is(fileSize(574), "574 B")
  t.is(fileSize(1_073_741_824), "1 GiB")

  let obj = fileSize(1_073_741_824, { asString: false })

  t.eq(Object.keys(obj), ["size", "unit", "toString"])
  t.is(obj.toString(), "1 GiB")
  t.is(String(obj), "1 GiB")
  t.eq(obj.size, 1)
  t.eq(obj.unit, "GiB")

  // Si
  t.is(fileSize(0, { SI: true }), "0 B")
  t.is(fileSize(574, { SI: true }), "574 B")
  t.is(fileSize(1_073_741_824, { SI: true, decimals: 0 }), "1 GB")
  t.is(fileSize(1_073_741_824, { SI: true }), "1.07 GB")

  obj = fileSize(1_073_741_824, { SI: true, asString: false })
  t.is(String(obj), "1.07 GB")
  t.eq(obj.size, 1.07)
  t.eq(obj.unit, "GB")

  obj = fileSize(0, { SI: true, asString: false })
  t.is(String(obj), "0 B")
  t.eq(obj.size, 0)
  t.eq(obj.unit, "B")
})

test("round decimals", (t) => {
  t.is(fileSize(1_040_000_000, { SI: true }), "1.04 GB")
  t.is(fileSize(1_044_000_000, { SI: true }), "1.04 GB")
  t.is(fileSize(1_044_900_000, { SI: true }), "1.04 GB")
  t.is(fileSize(1_045_000_000, { SI: true }), "1.05 GB")
  t.is(fileSize(1_049_000_000, { SI: true }), "1.05 GB")
})

test("accept file, blob and arrayBuffer", (t) => {
  t.is(fileSize(new Blob(["hello"]), { SI: true }), "5 B")
  t.is(fileSize(new File(["hello"], "hello.txt"), { SI: true }), "5 B")
  t.is(fileSize(new ArrayBuffer(5), { SI: true }), "5 B")

  t.is(fileSize(new Blob([""]), { SI: true }), "0 B")
  t.is(fileSize(new File([""], "hello.txt"), { SI: true }), "0 B")
  t.is(fileSize(new ArrayBuffer(0), { SI: true }), "0 B")
})
