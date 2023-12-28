import test from "../../../../42/test.js"
import checksum from "../../../../42/fabric/binary/checksum.js"

test.suite.timeout(1000)

test("throws", async (t) => {
  const errPrefix = "Input must be a string, ArrayBuffer or ArrayBufferView: "
  await t.throws(() => checksum(), errPrefix + "undefined")
  await t.throws(() => checksum(null), errPrefix + "null")
  await t.throws(() => checksum(1), errPrefix + "number")
  await t.throws(() => checksum(true), errPrefix + "boolean")
  await t.throws(() => checksum([]), errPrefix + "array")
  await t.throws(() => checksum({}), errPrefix + "object")
  await t.throws(() => checksum(new Map()), errPrefix + "object")
  await t.throws(() => checksum(Symbol("")), errPrefix + "symbol")
})

test("SHA-256", async (t) => {
  const text = "hello world"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashes = {
    hello: "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=",
    empty: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
  }

  t.is(await checksum(text), hashes.hello)
  t.is(await checksum(file), hashes.hello)
  t.is(await checksum(buffer), hashes.hello)
  t.is(await checksum(view), hashes.hello)

  t.is(await checksum(new Blob([])), hashes.empty)
  t.is(await checksum(new Blob([""])), hashes.empty)
  t.is(await checksum(new ArrayBuffer(0)), hashes.empty)
  t.is(await checksum(new Uint8Array()), hashes.empty)
})

test("SHA-256", "hex", async (t) => {
  const text = "hello world"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashes = {
    hello: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    empty: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }

  t.is(await checksum(text, { output: "hex" }), hashes.hello)
  t.is(await checksum(file, { output: "hex" }), hashes.hello)
  t.is(await checksum(buffer, { output: "hex" }), hashes.hello)
  t.is(await checksum(view, { output: "hex" }), hashes.hello)

  t.is(await checksum(new Blob([]), { output: "hex" }), hashes.empty)
  t.is(await checksum(new Blob([""]), { output: "hex" }), hashes.empty)
  t.is(await checksum(new ArrayBuffer(0), { output: "hex" }), hashes.empty)
  t.is(await checksum(new Uint8Array(), { output: "hex" }), hashes.empty)
})

test("SHA-384", async (t) => {
  const text = "hello world"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashes = {
    hello: "/b2OdaZ/KfcBpOBAOF4uI5hjA+oQI5IRr5B/y7g1eLPkF8txzmRu/QgZ3YwIjeG9",
    empty: "OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb",
  }

  const options = { algo: "SHA-384" }

  t.is(await checksum(text, options), hashes.hello)
  t.is(await checksum(file, options), hashes.hello)
  t.is(await checksum(buffer, options), hashes.hello)
  t.is(await checksum(view, options), hashes.hello)

  t.is(await checksum(new Blob([]), options), hashes.empty)
  t.is(await checksum(new Blob([""]), options), hashes.empty)
  t.is(await checksum(new ArrayBuffer(0), options), hashes.empty)
  t.is(await checksum(new Uint8Array(), options), hashes.empty)
})

test("SHA-1", async (t) => {
  const text = "hello world"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashes = {
    hello: "Kq5sNclPz7QV2+lfQIuc6R7oRu0=",
    empty: "2jmj7l5rSw0yVb/vlWAYkK/YBwk=",
  }

  const options = { algo: "SHA-1" }

  t.is(await checksum(text, options), hashes.hello)
  t.is(await checksum(file, options), hashes.hello)
  t.is(await checksum(buffer, options), hashes.hello)
  t.is(await checksum(view, options), hashes.hello)

  t.is(await checksum(new Blob([]), options), hashes.empty)
  t.is(await checksum(new Blob([""]), options), hashes.empty)
  t.is(await checksum(new ArrayBuffer(0), options), hashes.empty)
  t.is(await checksum(new Uint8Array(), options), hashes.empty)
})
