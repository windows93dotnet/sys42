/* eslint-disable unicorn/no-object-as-default-parameter */
// @related https://github.com/matthewp/fs/tree/master/test

import test, { suite } from "../../../42/test.js"
import fs from "../../../42/core/fs.js"
import system from "../../../42/system.js"

const { clone, parallel, shell, stream } = test.utils

const drivers = ["memory", "indexeddb"]

async function checkError(
  t,
  filename,
  fn,
  macro = {
    errno: 2,
    code: "ENOENT",
  }
) {
  await t.throws(fn, {
    name: "FileSystemError",
    path: `/tmp/${filename}`,
    stack: /fs.test.js/,
    ...macro,
  })
}

const IGNORE = new Set(["FileSystemError", "config", "mount"])
const IGNORE_SYNC = new Set([
  "sink",
  "source",
  /* test stream methods */
  "copy",
  "move",
])

const ALL_METHODS = Object.keys(fs).filter((x) => !IGNORE.has(x))
const ASYNC_METHODS = ALL_METHODS.filter((x) => !IGNORE_SYNC.has(x))

const makeSuite = (driver) => {
  suite.timeout(1000)
  suite.tests({ serial: true })

  const d = driver

  let savedConfig
  let savedCwd
  let savedTmp

  const paths = { files: [], dirs: ["/tmp"] }
  function cleanFile(...path) {
    paths.files.push(...path)
    return path[0]
  }

  function cleanable(...path) {
    paths.dirs.push(...path)
    return path[0]
  }

  test.setup(() => {
    savedConfig = clone(fs.config)
    savedTmp = system.files?.get("tmp")
    savedCwd = shell.cwd
    fs.config.places = {}
    fs.mount(`/tmp`, driver)
    shell.chdir("/tmp")
  })

  test.teardown(async () => {
    await parallel([
      parallel(paths.files, async (path) => {
        try {
          await fs.delete(path)
        } catch {}
      }),
      parallel(paths.dirs, async (path) => {
        try {
          await fs.deleteDir(path)
        } catch {}
      }),
    ])

    fs.config = savedConfig
    fs.mount()
    shell.chdir(savedCwd)
    system.files?.delete("tmp")
    if (savedTmp) system.files?.set("tmp", savedTmp)
  })

  /* file
  ======= */

  test("file", async (t) => {
    const path = cleanFile(`42-${d}-foo`)
    const content = "hello 🌍"
    await fs.write(path, content)
    const file = await fs.read(path, "utf-8")
    t.is(file, content)
    await fs.append(path, "🛰", "utf-8")
    t.is(await fs.read(path, "utf-8"), content + "🛰")
    await fs.delete(path)
    await checkError(t, path, () => fs.read(path))
  })

  test("write() without encoding", async (t) => {
    const path = cleanFile(`42-${d}-foo-binary`)
    const content = "hello 🌍"
    const { buffer } = new TextEncoder().encode(content)
    await fs.write(path, content)
    t.eq(await fs.read(path), buffer)
    t.is(await fs.read(path, "utf-8"), content)
    await fs.write(path, buffer)
    t.eq(await fs.read(path), buffer)
    t.is(await fs.read(path, "utf-8"), content)
    await fs.delete(path)
  })

  test("write() with encoding", async (t) => {
    const path = cleanFile(`42-${d}-foo-utf8`)
    const content = "hello 🌍"
    const { buffer } = new TextEncoder().encode(content)
    await fs.write(path, content, "utf-8")
    t.eq(await fs.read(path), buffer)
    t.is(await fs.read(path, "utf-8"), content)
    await fs.write(path, buffer, "utf-8")
    t.eq(await fs.read(path), buffer)
    t.is(await fs.read(path, "utf-8"), content)
    await fs.delete(path)
  })

  /* stream
  ========= */

  test("sink()", async (t) => {
    const path = `42-${d}-sink`
    cleanFile(path + 1, path + 2, path + 3, path + 10, path + 20, path + 30)

    const content = "h 🌍"
    const encoder = new TextEncoder()
    const chunks = {
      strings: ["h ", "🌍"],
      buffers: [
        encoder.encode("h ").buffer,
        new Uint8Array([0xf0]).buffer,
        new Uint8Array([0x9f, 0x8c, 0x8d]).buffer,
      ],
    }
    chunks.mixeds = [chunks.strings[0], chunks.buffers[1], chunks.buffers[2]]

    await stream.rs.array(chunks.strings).pipeTo(fs.sink(path + 1))
    t.eq(await fs.read(path + 1, "utf-8"), content)
    await stream.rs.array(chunks.buffers).pipeTo(fs.sink(path + 2))
    t.eq(await fs.read(path + 2, "utf-8"), content)
    await stream.rs.array(chunks.mixeds).pipeTo(fs.sink(path + 3))
    t.eq(await fs.read(path + 3, "utf-8"), content)

    // sink with encoding
    await stream.rs.array(chunks.strings).pipeTo(fs.sink(path + 10, "utf-8"))
    t.eq(await fs.read(path + 10, "utf-8"), content)
    await stream.rs.array(chunks.buffers).pipeTo(fs.sink(path + 20, "utf-8"))
    t.eq(await fs.read(path + 20, "utf-8"), content)
    await stream.rs.array(chunks.mixeds).pipeTo(fs.sink(path + 30, "utf-8"))
    t.eq(await fs.read(path + 30, "utf-8"), content)

    // intermediate folder creation
    const dir = cleanable(`42-${d}-sink-dir`) + "/"
    await stream.rs.array(chunks.strings).pipeTo(fs.sink(dir + path + 1))
    t.eq(await fs.read(dir + path + 1, "utf-8"), content)
    await stream.rs.array(chunks.buffers).pipeTo(fs.sink(dir + path + 2))
    t.eq(await fs.read(dir + path + 2, "utf-8"), content)
    await stream.rs.array(chunks.mixeds).pipeTo(fs.sink(dir + path + 3))
    t.eq(await fs.read(dir + path + 3, "utf-8"), content)
  })

  test("source()", async (t) => {
    const path = cleanFile(`42-${d}-source`)
    const content = "hello 🌍"
    const { buffer } = new TextEncoder().encode(content)
    await fs.write(path, content)
    t.eq(await stream.ws.collect(fs.source(path, "utf-8")), content)
    t.eq(await stream.ws.collect(fs.source(path)), buffer)
  })

  /* cbor
  ======= */

  test("cbor()", async (t) => {
    const path = cleanFile(`42-${d}-cbor`)
    const object = { a: 1 }
    await fs.writeCBOR(path, object)
    t.eq(await fs.readCBOR(path), object)
    t.eq(await fs.readText(path), "\ufffdaa\x01")
  })

  /* json
  ======= */

  test("json()", async (t) => {
    const path = cleanFile(`42-${d}-json`)
    const object = { a: 1 }
    await fs.writeJSON(path, object)
    t.eq(await fs.readJSON(path), object)
    t.eq(
      await fs.readText(path),
      `\
{
  "a": 1
}`
    )
  })

  test("json()", "preserve comments using JSON5", async (t) => {
    const path = cleanFile(`42-${d}-json5`)
    const content = `\
{
  // yep
  number: 1,
  /* string: 'yes', */
  object: { nested: true },
  array: ['this', 'that', 'the other']
}`

    const expected = {
      number: 1,
      object: { nested: true },
      array: ["this", "that", "the other"],
    }

    await fs.writeText(path, content)
    t.eq(await fs.readJSON(path), expected)

    expected.number = 42

    await fs.writeJSON(path, expected)

    t.eq(await fs.readText(path), content.replace("1", "42"))
  })

  /* dir
  ====== */

  test("dir", async (t) => {
    const path = cleanable(`42-${d}-dir`)
    t.false(await fs.isDir(path))
    await fs.writeDir(path)
    t.true(await fs.isDir(path))
    await fs.deleteDir(path)
    t.false(await fs.access(path))
  })

  test("dir", "recursive", async (t) => {
    cleanable(`42-${d}-a`)
    const path = `42-${d}-a/b/c`
    await fs.writeDir(path)
    t.true(await fs.isDir(`42-${d}-a`))
    t.true(await fs.isDir(`42-${d}-a/b`))
    t.true(await fs.isDir(`42-${d}-a/b/c`))
    await fs.deleteDir(path)
    t.true(await fs.isDir(`42-${d}-a`))
    t.true(await fs.isDir(`42-${d}-a/b`))
    t.false(await fs.access(`42-${d}-a/b/c`))
    await fs.deleteDir(`42-${d}-a`)
    t.false(await fs.access(`42-${d}-a`))
    t.false(await fs.access(`42-${d}-a/b`))
  })

  test("dir", "empty", async (t) => {
    const path = cleanable(`42-${d}-empty`)
    t.false(await fs.isDir(path))
    await fs.writeDir(path)
    t.true(await fs.isDir(path))
    t.eq(await fs.readDir(path), [])
    t.eq(await fs.readDir(path, { absolute: true }), [])
    t.eq(await fs.readDir(path, { recursive: true }), [])
    t.eq(await fs.readDir(path, { absolute: true, recursive: true }), [])
  })

  const dirLists = {
    base: [
      "a/", //
      "b/",
      "one",
      "two",
    ],
    recursive: [
      "a/three", //
      "b/",
      "one",
      "two",
    ],
    absolute: [
      `/tmp/42-${d}-rd/a/`,
      `/tmp/42-${d}-rd/b/`,
      `/tmp/42-${d}-rd/one`,
      `/tmp/42-${d}-rd/two`,
    ],
    recursiveAbsolute: [
      `/tmp/42-${d}-rd/a/three`,
      `/tmp/42-${d}-rd/b/`,
      `/tmp/42-${d}-rd/one`,
      `/tmp/42-${d}-rd/two`,
    ],
  }

  test("dir", "readDir", async (t) => {
    cleanable(`42-${d}-rd`)
    await Promise.all([
      fs.write(`42-${d}-rd/one`, "1"),
      fs.write(`42-${d}-rd/two`, "2"),
      fs.write(`42-${d}-rd/a/three`, "3"),
      fs.writeDir(`42-${d}-rd/b`),
    ])

    t.eq(await fs.readDir(`42-${d}-rd`), dirLists.base)
    t.eq(
      await fs.readDir(`42-${d}-rd`, { recursive: true }),
      dirLists.recursive
    )
    t.eq(await fs.readDir(`42-${d}-rd`, { absolute: true }), dirLists.absolute)
    t.eq(
      await fs.readDir(`42-${d}-rd`, { absolute: true, recursive: true }),
      dirLists.recursiveAbsolute
    )

    await fs.deleteDir(`42-${d}-rd`)
    t.false(await fs.access(`42-${d}-rd/a/three`))
    t.false(await fs.access(`42-${d}-rd`))
  })

  test("dir", "errors", async (t) => {
    cleanable(`42-${d}-err`)
    await Promise.all([
      fs.write(`42-${d}-err/one`, "1"),
      fs.write(`42-${d}-err/two`, "2"),
      fs.write(`42-${d}-err/a/three`, "3"),
      fs.writeDir(`42-${d}-err/b`),
    ])

    const eIsDir = {
      errno: 21,
      code: "EISDIR",
    }

    const eIsNotDir = {
      errno: 20,
      code: "ENOTDIR",
    }

    await checkError(t, `42-${d}-err`, () => fs.read(`42-${d}-err`), eIsDir)
    await checkError(t, `42-${d}-err`, () => fs.delete(`42-${d}-err`), eIsDir)
    await checkError(
      t,
      `42-${d}-err`,
      () => fs.write(`42-${d}-err`, "x"),
      eIsDir
    )
    await checkError(
      t,
      `42-${d}-err`,
      () => fs.append(`42-${d}-err`, "x"),
      eIsDir
    )

    await checkError(
      t,
      `42-${d}-err/one`,
      () => fs.readDir(`42-${d}-err/one`),
      eIsNotDir
    )
    await checkError(
      t,
      `42-${d}-err/one`,
      () => fs.deleteDir(`42-${d}-err/one`),
      eIsNotDir
    )
    await checkError(
      t,
      `42-${d}-err/one`,
      () => fs.writeDir(`42-${d}-err/one`),
      {
        errno: 17,
        code: "EEXIST",
      }
    )

    await t.notThrows(() => fs.writeDir(`42-${d}-err/b`))
  })

  test("no driver mounted", async (t) => {
    fs.config.places = {}
    fs.mount()

    await Promise.all(
      ASYNC_METHODS.map(async (m) =>
        t.throws(
          () => fs[m]("42-foo"),
          "no driver mounted for '/tmp/42-foo'",
          `"no driver mounted" did not throw for ${m}`
        )
      )
    )

    fs.mount(`/tmp`, driver)
  })
}

drivers.forEach((driver) => {
  suite.serial(driver, () => makeSuite(driver))
})
