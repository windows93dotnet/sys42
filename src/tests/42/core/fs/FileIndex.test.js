import test from "../../../../42/test.js"
import FileIndex from "../../../../42/core/fs/FileIndex.js"

const dummyInode = ["dummy inode"]

test("change event for files", async (t) => {
  t.plan(3)
  const fileindex = new FileIndex()

  const promise = new Promise((resolve) => {
    fileindex.on("change", (path, type, inode) => {
      t.is(path, "/foo.txt")
      t.is(type, "set")
      t.is(inode, dummyInode)
      resolve()
    })
  })

  fileindex.set("/foo.txt", dummyInode)

  await promise
})

test("change event for files and created folders", async (t) => {
  t.plan(4 * 2)
  const fileindex = new FileIndex()

  const changes = [
    "/foo", //
    "/foo/bar",
    "/foo/bar/baz",
    "/foo/bar/baz/file.txt",
  ]

  const promise = new Promise((resolve) => {
    fileindex.on("change", (path, type) => {
      t.is(path, changes.shift())
      t.is(type, "set")
      if (changes.length === 0) t.sleep(1).then(resolve)
    })
  })

  fileindex.set("/foo/bar/baz/file.txt", dummyInode)

  await promise
})

test("change event for files and created folders only", async (t) => {
  t.plan(3 * 2)
  const fileindex = new FileIndex({ foo: {} })

  const changes = [
    "/foo/bar", //
    "/foo/bar/baz",
    "/foo/bar/baz/file.txt",
  ]

  const promise = new Promise((resolve) => {
    fileindex.on("change", (path, type) => {
      t.is(path, changes.shift())
      t.is(type, "set")
      if (changes.length === 0) t.sleep(1).then(resolve)
    })
  })

  fileindex.set("/foo/bar/baz/file.txt", dummyInode)

  await promise
})
