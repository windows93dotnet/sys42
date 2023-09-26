import test from "../../../../42/test.js"
import FileLocator from "../../../../42/core/fs/FileLocator.js"

const dummyInode = ["dummy inode"]

test("change event for files", async (t) => {
  t.plan(3)
  const files = new FileLocator()

  const promise = new Promise((resolve) => {
    files.on("change", (path, type, inode) => {
      t.is(path, "/foo.txt")
      t.is(type, "set")
      t.is(inode, dummyInode)
      resolve()
    })
  })

  files.set("/foo.txt", dummyInode)

  await promise
})

test("change event for files and created folders", async (t) => {
  t.plan(4 * 2)
  const files = new FileLocator()

  const changes = [
    "/foo", //
    "/foo/bar",
    "/foo/bar/baz",
    "/foo/bar/baz/file.txt",
  ]

  const promise = new Promise((resolve) => {
    files.on("change", (path, type) => {
      t.is(path, changes.shift())
      t.is(type, "set")
      if (changes.length === 0) t.sleep(1).then(resolve)
    })
  })

  files.set("/foo/bar/baz/file.txt", dummyInode)

  await promise
})

test("change event for files and created folders only", async (t) => {
  t.plan(3 * 2)
  const files = new FileLocator({ foo: {} })

  const changes = [
    "/foo/bar", //
    "/foo/bar/baz",
    "/foo/bar/baz/file.txt",
  ]

  const promise = new Promise((resolve) => {
    files.on("change", (path, type) => {
      t.is(path, changes.shift())
      t.is(type, "set")
      if (changes.length === 0) t.sleep(1).then(resolve)
    })
  })

  files.set("/foo/bar/baz/file.txt", dummyInode)

  await promise
})
