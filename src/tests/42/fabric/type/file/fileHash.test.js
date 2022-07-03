import test from "../../../../../42/test.js"
import fileHash from "../../../../../42/fabric/type/file/fileHash.js"

test.suite.timeout(1000)

test("SHA-256", async (t) => {
  const text = "hello"
  const file = new Blob([text])
  const buffer = await file.arrayBuffer()
  const view = new Uint8Array(buffer)
  const hashs = {
    hello: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    empty: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  }

  t.is(await fileHash(text), hashs.hello)
  t.is(await fileHash(file), hashs.hello)
  t.is(await fileHash(buffer), hashs.hello)
  t.is(await fileHash(view), hashs.hello)

  t.is(await fileHash(new Blob([])), hashs.empty)
  t.is(await fileHash(new Blob([""])), hashs.empty)
  t.is(await fileHash(new ArrayBuffer()), hashs.empty)
  t.is(await fileHash(new Uint8Array()), hashs.empty)
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

  t.is(await fileHash(text, "SHA-1"), hashs.hello)
  t.is(await fileHash(file, "SHA-1"), hashs.hello)
  t.is(await fileHash(buffer, "SHA-1"), hashs.hello)
  t.is(await fileHash(view, "SHA-1"), hashs.hello)

  t.is(await fileHash(new Blob([]), "SHA-1"), hashs.empty)
  t.is(await fileHash(new Blob([""]), "SHA-1"), hashs.empty)
  t.is(await fileHash(new ArrayBuffer(), "SHA-1"), hashs.empty)
  t.is(await fileHash(new Uint8Array(), "SHA-1"), hashs.empty)
})
