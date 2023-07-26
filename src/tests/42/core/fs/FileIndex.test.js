import test from "../../../../42/test.js"
import FileIndex from "../../../../42/core/fs/FileIndex.js"

test("change event for files", async (t) => {
  t.plan(3)
  const fileindex = new FileIndex()

  const promise = new Promise((resolve) => {
    fileindex.on("change", (path, type, inode) => {
      t.is(path, "/foo.txt")
      t.is(type, "set")
      t.is(inode, "hello world")
      resolve()
    })
  })

  fileindex.set("/foo.txt", "hello world")

  await promise
})

test("change event on created folders", async (t) => {
  t.plan(4 * 2)
  const fileindex = new FileIndex()

  const changes = [
    "/foo/bar/baz/file.txt", //
    "/foo/bar/baz",
    "/foo/bar",
    "/foo",
  ]

  const promise = new Promise((resolve) => {
    fileindex.on("change", (path, type) => {
      t.is(path, changes.shift())
      t.is(type, "set")
      if (changes.length === 0) t.sleep(1).then(resolve)
    })
  })

  fileindex.set("/foo/bar/baz/file.txt", "hello world")

  await promise
})

test("change event only on created folders", async (t) => {
  t.plan(3 * 2)
  const fileindex = new FileIndex({ foo: {} })

  const changes = [
    "/foo/bar/baz/file.txt", //
    "/foo/bar/baz",
    "/foo/bar",
  ]

  const promise = new Promise((resolve) => {
    fileindex.on("change", (path, type) => {
      t.is(path, changes.shift())
      t.is(type, "set")
      if (changes.length === 0) t.sleep(1).then(resolve)
    })
  })

  fileindex.set("/foo/bar/baz/file.txt", "hello world")

  await promise
})
