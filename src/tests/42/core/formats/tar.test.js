import test from "../../../../42/test.js"
import tar from "../../../../42/core/formats/tar.js"

const { stream } = test.utils

test("extract", "multi-file", async (t) => {
  const res = await fetch("/tests/fixtures/tar/multi-file.tar")

  const blobs = await stream.ws.collect(res.body.pipeThrough(tar.extract()))

  t.is(blobs.length, 2)
  t.eq(await blobs[0].header, {
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
  })
  t.eq(await blobs[1].header, {
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
  })
  t.is(await blobs[0].file.text(), "i am file-1\n")
  t.is(await blobs[1].file.text(), "i am file-2\n")
})
