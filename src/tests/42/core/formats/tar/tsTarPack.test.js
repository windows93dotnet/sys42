/* spell-checker: disable */

import test from "../../../../../42/test.js"
import tsTarPack from "../../../../../42/core/formats/tar/tsTarPack.js"

const { stream, load } = test.utils

test("pack", async (t) => {
  t.timeout(1000)

  const pack = tsTarPack()

  pack.add(
    {
      name: "test.txt",
      mtime: 1_387_580_181_000,
      mode: 0o644,
      uname: "maf",
      gname: "staff",
      uid: 501,
      gid: 20,
    },
    "hello world\n"
  )

  const [actual, expected] = await Promise.all([
    stream.ws.collect(pack.stream()),
    load.arrayBuffer("/tests/fixtures/tar/one-file.tar"),
  ])

  t.eq(actual, expected)
})

test("pack", "File", async (t) => {
  t.timeout(1000)

  const pack = tsTarPack()

  pack.add(
    {
      mode: 0o644,
      uname: "maf",
      gname: "staff",
      uid: 501,
      gid: 20,
    },
    new File(["hello world\n"], "test.txt", {
      lastModified: 1_387_580_181_000,
    })
  )

  const [actual, expected] = await Promise.all([
    stream.ws.collect(pack.stream()),
    load.arrayBuffer("/tests/fixtures/tar/one-file.tar"),
  ])

  t.eq(actual, expected)
})

test("pack", "File without header", async (t) => {
  t.timeout(1000)

  const pack = tsTarPack()

  pack.add(
    new File(["hello world\n"], "test.txt", {
      lastModified: 1_387_580_181_000,
    })
  )

  const [actual, expected] = await Promise.all([
    stream.ws.collect(pack.stream()),
    load.arrayBuffer("/tests/fixtures/tar/hello-world.tar"),
  ])

  t.eq(actual, expected)
})
