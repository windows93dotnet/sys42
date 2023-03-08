import test from "../../../42/test.js"
import stream from "../../../42/core/stream.js"
import http from "../../../42/core/http.js"

test.serial("verify polyfills", async (t) => {
  t.timeout(1000)
  t.plan(1)
  const res = await fetch("/tests/fixtures/stream/data.json")
  await res.body
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.json())
    .pipeThrough(stream.ts.each((item) => t.eq(item, { a: 1 })))
    .pipeTo(stream.ws.sink())
})

test("writable", "collect()", async (t) => {
  const actual = await stream.ws.collect(stream.rs.source(["ab", "c"]))
  t.eq(actual, new Uint8Array([0x61, 0x62, 0x63]).buffer)
})

test.serial("writable", "collect()", "more than 64KiB", async (t) => {
  t.timeout(1000)
  const orignal = new Uint8Array(new Array(65_536 + 1).fill(0)).buffer
  const actual = await stream.ws.collect(stream.rs.source(orignal))
  t.eq(actual, orignal)
})

test("writable", "collect()", "text", async (t) => {
  const actual = await stream.ws.collect(
    stream.rs.source(["ab", "c"]).pipeThrough(stream.ts.text())
  )
  t.is(actual, "abc")
})

test("writable", "sink()", async (t) => {
  t.plan(1)
  await stream.rs
    .source(["ab", "c"])
    .pipeThrough(stream.ts.text())
    .pipeTo(stream.ws.sink((data) => t.is(data, "abc")))
})

test.cb("writable", "sample()", async (t) => {
  t.plan(2)
  const actual = await stream.ws.sample(
    stream.rs.source(["ab", "c"]),
    (branch) => {
      branch.pipeThrough(stream.ts.text()).pipeTo(
        stream.ws.sink((data) => {
          t.is(data, "abc")
          t.end()
        })
      )
    }
  )
  t.eq(actual, new Uint8Array([0x61, 0x62, 0x63]).buffer)
})

test("readable", "tee()", async (t) => {
  t.plan(3)
  const res = await stream.rs.tee(stream.rs.source(["ab", "c"]), (a, b) => [
    a.pipeThrough(stream.ts.text()).pipeTo(
      stream.ws.sink((data) => {
        t.is(data, "abc")
      })
    ),
    b.pipeTo(
      stream.ws.sink((data) => {
        t.eq(data, new Uint8Array([0x61, 0x62, 0x63]).buffer)
      })
    ),
  ])
  t.eq(res, [undefined, undefined])
})

test.serial("readable", "get()", async (t) => {
  t.timeout(1000)
  const actual = (
    await stream.ws.collect(
      http
        .source("/tests/fixtures/stream/data.json")
        .pipeThrough(stream.ts.text())
    )
  ).replaceAll("\r\n", "\n")

  const expected = `\
{
  "a": 1
}
`

  t.is(actual, expected)
})

test("readable", "wrap()", async (t) => {
  t.timeout(1000)
  const actual = await stream.ws.collect(
    stream.rs
      .wrap(stream.rs.source(["ab", "c"]), { before: "[", after: "]" })
      .pipeThrough(stream.ts.text())
  )

  t.is(actual, "[abc]")
})

// don't work with "node:stream/web"
test.noop("transform", "arrayBuffer() + text()", async (t) => {
  const actual = await stream.ws.collect(
    stream.rs
      .array(["hello \ud83c", "\udf0d"])
      .pipeThrough(stream.ts.arrayBuffer())
      .pipeThrough(stream.ts.text())
  )

  t.is(actual, "hello 🌍")
})

test("transform", "arrayBuffer() + text()", 2, async (t) => {
  const sources = [
    [new Uint8Array([0x68, 0xf0, 0x9f, 0x8c, 0x8d]).buffer],
    [
      new Uint8Array([0x68, 0xf0, 0x9f, 0x8c]).buffer,
      new Uint8Array([0x8d]).buffer,
    ],
    [
      new Uint8Array([0x68, 0xf0, 0x9f]).buffer,
      new Uint8Array([0x8c, 0x8d]).buffer,
    ],
    [
      new Uint8Array([0x68, 0xf0]).buffer,
      new Uint8Array([0x9f, 0x8c, 0x8d]).buffer,
    ],
    [
      new Uint8Array([0x68]).buffer,
      new Uint8Array([0xf0, 0x9f, 0x8c, 0x8d]).buffer,
    ],
    [
      new Uint8Array([]).buffer,
      new Uint8Array([0x68, 0xf0, 0x9f, 0x8c, 0x8d]).buffer,
    ],
    [
      new Uint8Array([0x68, 0xf0, 0x9f, 0x8c, 0x8d]).buffer,
      new Uint8Array([]).buffer,
    ],
  ]

  for (const source of sources) {
    t.is(
      await stream.ws.collect(
        stream.rs
          .array(source)
          .pipeThrough(stream.ts.text())
          .pipeThrough(stream.ts.arrayBuffer())
          .pipeThrough(stream.ts.text())
      ),
      "h🌍"
    )
  }
})

test("transform", "each()", async (t) => {
  t.plan(2)
  const expected = ["a", "b"]
  await stream.rs
    .source(["a", "b"])
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.each((item, i) => t.is(item, expected[i])))
    .pipeTo(stream.ws.sink())
})

test("transform", "map()", async (t) => {
  t.plan(3)
  await stream.rs
    .source(["a", "b"])
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.map((item) => item + "!"))
    .pipeThrough(stream.ts.each((item) => t.true(/[ab]!/.test(item))))
    .pipeTo(stream.ws.sink((item) => t.is(item, "a!b!")))
})

test("transform", "map()", 2, async (t) => {
  t.plan(1)
  await stream.rs
    .source(["💦", "💦"])
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.map((item) => item + "!"))
    .pipeTo(stream.ws.sink((item) => t.is(item, "💦!💦!")))
})

test("transform", "split() + join()", async (t) => {
  t.plan(1)
  await stream.rs
    .source(["a\nb\n", "c\nd"])
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.split())
    .pipeThrough(stream.ts.join("+"))
    .pipeTo(stream.ws.sink((item) => t.is(item, "a+b+c+d")))
})

test("transform", "split() + join()", "include: true", async (t) => {
  t.plan(1)
  await stream.rs
    .source(["a\nb\n", "c\nd"])
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.split("\n", { include: true }))
    .pipeThrough(stream.ts.join("+"))
    .pipeTo(stream.ws.sink((item) => t.is(item, `a\n+b\n+c\n+d`)))
})

test("transform", "combine()", async (t) => {
  t.plan(1)
  await stream.rs
    .source(["💦", "💦"])
    .pipeThrough(
      stream.ts.combine([
        stream.ts.text(), //
        stream.ts.map((item) => item + "!"),
        stream.ts.map((item) => item + "?"),
      ])
    )
    .pipeTo(stream.ws.sink((item) => t.is(item, "💦!?💦!?")))
})

test("transform", "combine()", "with readable", async (t) => {
  t.plan(1)
  await stream.ts
    .combine([
      stream.rs.source(["💦", "💦"]),
      stream.ts.text(),
      stream.ts.map((item) => item + "!"),
      stream.ts.map((item) => item + "?"),
    ])
    .pipeTo(stream.ws.sink((item) => t.is(item, "💦!?💦!?")))
})

test("transform", "text() + arrayBuffer()", async (t) => {
  const bytes = [97, 98, 99]
  const chunks = ["ab", "c"]
  let i = 0
  let j = 0

  t.plan(1 + chunks.length + bytes.length)

  await stream.rs
    .source(chunks)
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.each((x) => t.is(x, chunks[i++])))
    .pipeThrough(stream.ts.arrayBuffer())
    .pipeThrough(
      stream.ts.each((x) => {
        for (const byte of x) t.is(byte, bytes[j++])
      })
    )
    .pipeThrough(stream.ts.text())
    .pipeTo(stream.ws.sink((item) => t.is(item, "abc")))
})

test("transform", "cut()", async (t) => {
  t.plan(2)

  const chunks = [new Uint8Array(42), new Uint8Array(42)]
  chunks[0].fill(1)
  chunks[1].fill(2)

  const expected = t.utils.combine(...chunks).buffer

  const parts = []

  await stream.rs
    .array(chunks)
    .pipeThrough(stream.ts.cut(20))
    .pipeThrough(stream.ts.each((x) => parts.push(x.length)))
    .pipeTo(stream.ws.sink((item) => t.eq(item, expected)))

  t.eq(parts, [20, 20, 20, 20, 4])
})

test("transform", "cut()", "exact: true", async (t) => {
  t.plan(2)

  const chunks = [new Uint8Array(42), new Uint8Array(42)]
  chunks[0].fill(1)
  chunks[1].fill(2)

  const expected = t.utils.combine(...chunks).buffer

  const parts = []

  await stream.rs
    .array(chunks)
    .pipeThrough(stream.ts.cut(20, { exact: false }))
    .pipeThrough(stream.ts.each((x) => parts.push(x.length)))
    .pipeTo(stream.ws.sink((item) => t.eq(item, expected)))

  t.eq(parts, [20, 20, 2, 20, 20, 2])
})

if ("CompressionStream" in globalThis) {
  test.serial("transform", "compress() + decompress()", async (t) => {
    t.timeout(1000)
    const original = new TextEncoder().encode("💦💦")

    const compressed = await stream.ws.collect(
      stream.rs.source(["💦", "💦"]).pipeThrough(stream.ts.compress())
    )

    t.true(
      original.byteLength < compressed.byteLength,
      "less byteLength in compressed"
    )

    const decompressed = await stream.ws.collect(
      stream.rs.source(compressed).pipeThrough(stream.ts.decompress())
    )

    t.true(
      original.byteLength === decompressed.byteLength,
      "decompressed byteLength is equal to original byteLength"
    )

    t.is(new TextDecoder().decode(decompressed), "💦💦")
  })
}

/*  */

test.serial("ndjson", async (t) => {
  t.timeout(1000)
  t.plan(3)
  const expecteds = [
    { some: "thing" },
    { foo: 17, bar: false, quux: true },
    { may: { include: "nested", objects: ["and", "arrays"] } },
  ]
  await http
    .source("/tests/fixtures/stream/data.ndjson")
    .pipeThrough(stream.ts.text())
    .pipeThrough(stream.ts.split(/(?:\r?\n)+/))
    .pipeThrough(stream.ts.json())
    .pipeThrough(stream.ts.each((val, i) => t.eq(val, expecteds[i])))
    .pipeTo(stream.ws.sink())
})
