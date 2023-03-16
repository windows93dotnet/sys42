/* spell-checker: disable */

import test from "../../../../42/test.js"
import tar from "../../../../42/core/formats/tar.js"

test("tar", async (t) => {
  const items = await tar.extract("/tests/fixtures/tar/multi-file.tar")
  const files = []
  const headers = items.map((item) => {
    files.push(item.file().then((file) => file.text()))
    return { ...item }
  })
  t.eq(headers, [
    {
      name: "file-1.txt",
      mode: 0o644,
      uid: 501,
      gid: 20,
      size: 12,
      mtime: 1_387_580_181_000,
      type: "file",
      linkname: null,
      uname: "maf",
      gname: "staff",
      devmajor: 0,
      devminor: 0,
    },
    {
      name: "file-2.txt",
      mode: 0o644,
      uid: 501,
      gid: 20,
      size: 12,
      mtime: 1_387_580_181_000,
      type: "file",
      linkname: null,
      uname: "maf",
      gname: "staff",
      devmajor: 0,
      devminor: 0,
    },
  ])

  t.eq(await Promise.all(files), ["i am file-1\n", "i am file-2\n"])
})
