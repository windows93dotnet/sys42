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
    hello: "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=",
    empty: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
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

test("SHA-256", "hex", async (t) => {
  const text = "hello world"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashs = {
    hello: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    empty: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }

  t.is(await checksum(text, { output: "hex" }), hashs.hello)
  t.is(await checksum(file, { output: "hex" }), hashs.hello)
  t.is(await checksum(buffer, { output: "hex" }), hashs.hello)
  t.is(await checksum(view, { output: "hex" }), hashs.hello)

  t.is(await checksum(new Blob([]), { output: "hex" }), hashs.empty)
  t.is(await checksum(new Blob([""]), { output: "hex" }), hashs.empty)
  t.is(await checksum(new ArrayBuffer(), { output: "hex" }), hashs.empty)
  t.is(await checksum(new Uint8Array(), { output: "hex" }), hashs.empty)
})

test("SHA-384", async (t) => {
  const text = "hello"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashs = {
    hello: "/b2OdaZ/KfcBpOBAOF4uI5hjA+oQI5IRr5B/y7g1eLPkF8txzmRu/QgZ3YwIjeG9",
    empty: "OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb",
  }

  const options = { algo: "SHA-384" /* , output: "binary" */ }

  t.is(await checksum(text, options), hashs.hello)
  t.is(await checksum(file, options), hashs.hello)
  t.is(await checksum(buffer, options), hashs.hello)
  t.is(await checksum(view, options), hashs.hello)

  t.is(await checksum(new Blob([]), options), hashs.empty)
  t.is(await checksum(new Blob([""]), options), hashs.empty)
  t.is(await checksum(new ArrayBuffer(), options), hashs.empty)
  t.is(await checksum(new Uint8Array(), options), hashs.empty)
})

test.skip("SHA-1", async (t) => {
  const text = "hello"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashs = {
    hello: "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
    empty: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  }

  const options = { algo: "SHA-1", output: "hex" }

  t.is(await checksum(text, options), hashs.hello)
  t.is(await checksum(file, options), hashs.hello)
  t.is(await checksum(buffer, options), hashs.hello)
  t.is(await checksum(view, options), hashs.hello)

  t.is(await checksum(new Blob([]), options), hashs.empty)
  t.is(await checksum(new Blob([""]), options), hashs.empty)
  t.is(await checksum(new ArrayBuffer(), options), hashs.empty)
  t.is(await checksum(new Uint8Array(), options), hashs.empty)
})
