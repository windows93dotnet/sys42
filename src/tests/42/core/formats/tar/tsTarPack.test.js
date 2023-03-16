/* spell-checker: disable */

import test from "../../../../../42/test.js"
import rsTarPack from "../../../../../42/core/formats/tar/tsTarPack.js"

const { stream, load } = test.utils

test("pack", async (t) => {
  t.timeout(800)

  const pack = rsTarPack()

  pack.entry(
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

  pack.finalize()

  const [actual, expected] = await Promise.all([
    stream.ws.collect(pack.readable),
    load.arrayBuffer("/tests/fixtures/tar/one-file.tar"),
  ])

  t.eq(actual, expected)
})
