import test from "../../../../42/test.js"
import tar from "../../../../42/core/formats/tar.js"

const { stream, http } = test.utils

test("extract", "multi-file", async (t) => {
  const blobs = await stream.ws.collect(
    http
      .stream("/tests/fixtures/tar/multi-file.tar")
      .pipeThrough(stream.ts.cut(321))
      .pipeThrough(tar.extract())
  )

  t.is(blobs.length, 2)
  t.is(await blobs[0].file.text(), "i am file-1\n")
  t.is(await blobs[1].file.text(), "i am file-2\n")
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
})

test("extract", "pax", async (t) => {
  const blobs = await stream.ws.collect(
    http
      .stream("/tests/fixtures/tar/pax.tar")
      .pipeThrough(stream.ts.cut(321))
      .pipeThrough(tar.extract())
  )

  t.is(blobs.length, 1)
  t.is(await blobs[0].file.text(), "hello world\n")
  t.eq(await blobs[0].header, {
    name: "pax.txt",
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
    pax: { path: "pax.txt", special: "sauce" },
  })
})

test("extract", "types", async (t) => {
  const blobs = await stream.ws.collect(
    http
      .stream("/tests/fixtures/tar/types.tar")
      .pipeThrough(stream.ts.cut(321))
      .pipeThrough(tar.extract())
  )

  t.is(blobs.length, 2)
  t.eq(await blobs[0].header, {
    name: "directory",
    mode: 0o755,
    uid: 501,
    gid: 20,
    size: 0,
    mtime: 1_387_580_181_000,
    type: "directory",
    linkname: null,
    uname: "maf",
    gname: "staff",
    devmajor: 0,
    devminor: 0,
  })
  t.eq(await blobs[1].header, {
    name: "directory-link",
    mode: 0o755,
    uid: 501,
    gid: 20,
    size: 0,
    mtime: 1_387_580_181_000,
    type: "symlink",
    linkname: "directory",
    uname: "maf",
    gname: "staff",
    devmajor: 0,
    devminor: 0,
  })
})

test("extract", "long-name", async (t) => {
  const blobs = await stream.ws.collect(
    http
      .stream("/tests/fixtures/tar/long-name.tar")
      .pipeThrough(stream.ts.cut(321))
      .pipeThrough(tar.extract())
  )

  t.is(blobs.length, 1)
  t.is(await blobs[0].file.text(), "hello long name\n")
  t.eq(await blobs[0].header, {
    name: "my/file/is/longer/than/100/characters/and/should/use/the/prefix/header/foobarbaz/foobarbaz/foobarbaz/foobarbaz/foobarbaz/foobarbaz/filename.txt",
    mode: 0o644,
    uid: 501,
    gid: 20,
    size: 16,
    mtime: 1_387_580_181_000,
    type: "file",
    linkname: null,
    uname: "maf",
    gname: "staff",
    devmajor: 0,
    devminor: 0,
  })
})

test("extract", "unicode-bsd", async (t) => {
  const blobs = await stream.ws.collect(
    http
      .stream("/tests/fixtures/tar/unicode-bsd.tar")
      .pipeThrough(stream.ts.cut(321))
      .pipeThrough(tar.extract())
  )

  t.is(blobs.length, 1)
  t.is(await blobs[0].file.text(), "hej\n")
  t.eq(await blobs[0].header, {
    name: "høllø.txt",
    mode: 0o644,
    uid: 501,
    gid: 20,
    size: 4,
    mtime: 1_387_588_646_000,
    pax: {
      "SCHILY.dev": "16777217",
      "SCHILY.ino": "3599143",
      "SCHILY.nlink": "1",
      "atime": "1387589077",
      "ctime": "1387588646",
      "path": "høllø.txt",
    },
    type: "file",
    linkname: null,
    uname: "maf",
    gname: "staff",
    devmajor: 0,
    devminor: 0,
  })
})

test("extract", "unicode", async (t) => {
  const blobs = await stream.ws.collect(
    http
      .stream("/tests/fixtures/tar/unicode.tar")
      .pipeThrough(stream.ts.cut(321))
      .pipeThrough(tar.extract())
  )

  t.is(blobs.length, 1)
  t.is(await blobs[0].file.text(), "høllø\n")
  t.eq(await blobs[0].header, {
    name: "høstål.txt",
    mode: 0o644,
    uid: 501,
    gid: 20,
    size: 8,
    mtime: 1_387_580_181_000,
    pax: { path: "høstål.txt" },
    type: "file",
    linkname: null,
    uname: "maf",
    gname: "staff",
    devmajor: 0,
    devminor: 0,
  })
})
