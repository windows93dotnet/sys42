import test from "../../../../../42/test.js"
import checksum from "../../../../../42/fabric/type/file/checksum.js"

test.suite.timeout(1000)

test("throws", async (t) => {
  const errPrefix =
    "input must be a string, File, Blob, ArrayBuffer or TypedArray: "
  await t.throws(() => checksum(), errPrefix + "undefined")
  await t.throws(() => checksum(null), errPrefix + "object")
  await t.throws(() => checksum(1), errPrefix + "number")
  await t.throws(() => checksum(true), errPrefix + "boolean")
  await t.throws(() => checksum([]), errPrefix + "object")
  await t.throws(() => checksum({}), errPrefix + "object")
  await t.throws(() => checksum(new Map()), errPrefix + "object")
  await t.throws(() => checksum(Symbol("")), errPrefix + "symbol")
})

test("SHA-256", async (t) => {
  const text = "hello world"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashs = {
    hello: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    empty: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }

  t.is(await checksum(text), hashs.hello)
  t.is(await checksum(file), hashs.hello)
  t.is(await checksum(buffer), hashs.hello)
  t.is(await checksum(view), hashs.hello)

  t.is(await checksum(new Blob([])), hashs.empty)
  t.is(await checksum(new Blob([""])), hashs.empty)
  t.is(await checksum(new ArrayBuffer()), hashs.empty)
  t.is(await checksum(new Uint8Array()), hashs.empty)
})

test("SHA-1", async (t) => {
  const text = "hello"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashs = {
    hello: "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
    empty: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  }

  t.is(await checksum(text, "SHA-1"), hashs.hello)
  t.is(await checksum(file, "SHA-1"), hashs.hello)
  t.is(await checksum(buffer, "SHA-1"), hashs.hello)
  t.is(await checksum(view, "SHA-1"), hashs.hello)

  t.is(await checksum(new Blob([]), "SHA-1"), hashs.empty)
  t.is(await checksum(new Blob([""]), "SHA-1"), hashs.empty)
  t.is(await checksum(new ArrayBuffer(), "SHA-1"), hashs.empty)
  t.is(await checksum(new Uint8Array(), "SHA-1"), hashs.empty)
})
