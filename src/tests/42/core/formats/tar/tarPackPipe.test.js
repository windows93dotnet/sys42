/* spell-checker: disable */
// @src https://github.com/mafintosh/tar-stream/blob/master/test/pack.js

import test from "../../../../../42/test.js"
import tarPackPipe from "../../../../../42/core/formats/tar/tarPackPipe.js"
import getBasename from "../../../../../42/core/path/core/getBasename.js"

const { stream, load } = test.utils
const { task } = test

test("pack", "File without header", async (t) => {
  t.timeout(1000)

  const pack = tarPackPipe()

  pack.add(
    new File(["hello world\n"], "test.txt", {
      lastModified: 1_387_580_181_000,
    })
  )

  const [actual, expected] = await Promise.all([
    stream.collect(pack.stream()),
    load.arrayBuffer("/tests/fixtures/tar/hello-world.tar"),
  ])

  t.eq(actual, expected)
})

test.tasks(
  [
    task({
      url: "/tests/fixtures/tar/one-file.tar",
      files: ["hello world\n"],
      headers: [
        {
          name: "test.txt",
          mtime: 1_387_580_181_000,
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
        },
      ],
    }),

    task({
      // file compressed using CompressionStream differ from linux tar
      // TODO: make one-file gzip fixture
      skip: true,
      url: "/tests/fixtures/tar/one-file.tar.gz",
      options: { gzip: true },
      files: ["hello world\n"],
      headers: [
        {
          name: "test.txt",
          mtime: 1_387_580_181_000,
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/one-file.tar",
      files: [
        new File(["hello world\n"], "test.txt", {
          lastModified: 1_387_580_181_000,
        }),
      ],
      headers: [
        {
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/multi-file.tar",
      headers: [
        {
          name: "file-1.txt",
          mtime: 1_387_580_181_000,
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
          file: "i am file-1\n",
        },
        {
          name: "file-2.txt",
          mtime: 1_387_580_181_000,
          mode: 0o644,
          size: 12,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
          file: "i am file-2\n",
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/pax.tar",
      headers: [
        {
          name: "pax.txt",
          mtime: 1_387_580_181_000,
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
          pax: { special: "sauce" },
          file: "hello world\n",
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/types.tar",
      headers: [
        {
          name: "directory",
          mtime: 1_387_580_181_000,
          type: "directory",
          mode: 0o755,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
        },
        {
          name: "directory-link",
          mtime: 1_387_580_181_000,
          type: "symlink",
          linkname: "directory",
          mode: 0o755,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
          size: 9, // Should convert to zero
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/long-name.tar",
      headers: [
        {
          name: "my/file/is/longer/than/100/characters/and/should/use/the/prefix/header/foobarbaz/foobarbaz/foobarbaz/foobarbaz/foobarbaz/foobarbaz/filename.txt",
          mtime: 1_387_580_181_000,
          type: "file",
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
          file: "hello long name\n",
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/large-uid-gid.tar",
      headers: [
        {
          name: "test.txt",
          mtime: 1_387_580_181_000,
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 1_000_000_001,
          gid: 1_000_000_002,
          file: "hello world\n",
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/unicode.tar",
      headers: [
        {
          name: "høstål.txt",
          mtime: 1_387_580_181_000,
          type: "file",
          mode: 0o644,
          uname: "maf",
          gname: "staff",
          uid: 501,
          gid: 20,
          file: "høllø\n",
        },
      ],
    }),
  ],

  (test, { title, url, headers, options, files }) => {
    test("pack", title ?? getBasename(url), async (t) => {
      t.timeout(1000)

      const pack = tarPackPipe(options)

      for (let i = 0, l = headers.length; i < l; i++) {
        pack.add(headers[i], files?.[i])
      }

      const [actual, expected] = await Promise.all([
        stream.collect(pack.stream()),
        load.arrayBuffer(url),
      ])

      if (options?.gzip !== true) t.is(actual.byteLength & 511, 0)

      t.eq(actual, expected)
    })
  }
)
