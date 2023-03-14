/* spell-checker: disable */

import test from "../../../../42/test.js"
import tar from "../../../../42/core/formats/tar.js"
import getBasename from "../../../../42/core/path/core/getBasename.js"

const { stream, http } = test.utils
const { task } = test

// @src https://github.com/mafintosh/tar-stream/blob/master/test/extract.js

test.tasks(
  [
    task({
      url: "/tests/fixtures/tar/one-file.tar",
      files: ["hello world\n"],
      headers: [
        {
          name: "test.txt",
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
      ],
    }),

    task({
      url: "/tests/fixtures/tar/one-file.tar.gz",
      options: { gzip: true },
      files: ["hello world\n"],
      headers: [
        {
          name: "test.txt",
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
      ],
    }),

    task({
      // only: true,
      url: "/tests/fixtures/tar/multi-file.tar",
      files: ["i am file-1\n", "i am file-2\n"],
      headers: [
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
      ],
    }),

    task({
      url: "/tests/fixtures/tar/pax.tar",
      files: ["hello world\n"],
      headers: [
        {
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
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/types.tar",
      headers: [
        {
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
        },
        {
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
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/long-name.tar",
      files: ["hello long name\n"],
      headers: [
        {
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
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/unicode-bsd.tar",
      files: ["hej\n"],
      headers: [
        {
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
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/unicode.tar",
      files: ["høllø\n"],
      headers: [
        {
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
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/name-is-100.tar",
      files: ["hello\n"],
      headers: [
        {
          name: "node_modules/mocha-jshint/node_modules/jshint/node_modules/console-browserify/test/static/index.html",
          mode: 420,
          uid: 501,
          gid: 0,
          size: 6,
          mtime: 1_389_643_870_000,
          type: "file",
          linkname: null,
          uname: "maf",
          gname: "wheel",
          devmajor: 0,
          devminor: 0,
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/invalid.tgz",
      // options: { gzip: true },
      throws:
        "Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?",
    }),

    task({
      title: "space prefixed",
      url: "/tests/fixtures/tar/space.tar",
      length: 4,
    }),

    task({
      skip: true,
      title: "gnu long path",
      url: "/tests/fixtures/tar/gnu-long-path.tar",
    }),

    task({
      title: "base 256 uid and gid",
      url: "/tests/fixtures/tar/base-256-uid-gid.tar",
      headers: [
        {
          uid: 116_435_139,
          gid: 1_876_110_778,
        },
      ],
    }),

    task({
      url: "/tests/fixtures/tar/unknown-format.tar",
      options: { allowUnknownFormat: true },
      files: ["i am file-1\n", "i am file-2\n"],
      headers: [
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
      ],
    }),

    task({
      url: "/tests/fixtures/tar/unknown-format.tar",
      throws: "Invalid tar header: unknown format.",
    }),

    // task({
    //   only: true,
    //   url: "/tests/fixtures/tar/huge.tar.gz",
    //   options: { gzip: true },
    //   length: 1,
    // }),
  ],

  (test, { title, url, options, files, headers, length, throws }) => {
    if (throws) {
      test("extract", "throws", title ?? getBasename(url), async (t) => {
        t.timeout(1000)
        await t.throws(
          () =>
            stream.ws.collect(
              http
                .source(url)
                .pipeThrough(stream.ts.cut(321))
                .pipeThrough(tar.extract(options))
            ),
          throws
        )
      })
      return
    }

    test("extract", title ?? getBasename(url), async (t) => {
      t.timeout(1000)

      const items = await stream.ws.collect(
        http
          .source(url)
          .pipeThrough(stream.ts.cut(321))
          .pipeThrough(tar.extract(options))
      )

      if (files) {
        t.eq(
          await Promise.all(
            items.map(async ({ file }) => (await file()).text())
          ),
          files
        )

        t.eq(
          await Promise.all(
            items.map(async (item) =>
              stream.ws.collect(item.stream.pipeThrough(stream.ts.text()))
            )
          ),
          files
        )
      }

      if (headers) {
        if (Object.keys(headers[0]).length === 12) {
          t.eq(
            items.map((header) => ({ ...header })),
            headers
          )
        } else {
          t.hasSubset(
            items.map((header) => ({ ...header })),
            headers
          )
        }
      }

      length ??= files?.length ?? headers?.length

      if (length !== undefined) t.is(items.length, length)
    })
  }
)
