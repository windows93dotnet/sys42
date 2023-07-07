import test from "../../../42/test.js"
import stream from "../../../42/core/stream.js"
import http from "../../../42/core/http.js"
import combineArrayBufferView from "../../../42/fabric/binary/combineArrayBufferView.js"

test.serial("verify polyfills", async (t) => {
  t.timeout(1000)
  t.plan(1)
  const res = await fetch("/tests/fixtures/stream/data.json")
  await res.body
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.each((item) => t.eq(JSON.parse(item), { a: 1 })))
    .pipeTo(stream.sink())
})

test("writable", "collect()", async (t) => {
  const actual = await stream.collect(stream.source(["ab", "c"]))
  t.eq(actual, new Uint8Array([0x61, 0x62, 0x63]).buffer)
})

test.serial("writable", "collect()", "more than 64KiB", async (t) => {
  t.timeout(1000)
  const original = new Uint8Array(new Array(65_536 + 1).fill(0)).buffer
  const actual = await stream.collect(stream.source(original))
  t.eq(actual, original)
})

test("writable", "collect()", "text", async (t) => {
  const actual = await stream.collect(
    stream.source(["ab", "c"]).pipeThrough(stream.pipe.text()),
  )
  t.is(actual, "abc")
})

test("writable", "sink()", async (t) => {
  t.plan(1)
  await stream
    .source(["ab", "c"])
    .pipeThrough(stream.pipe.text())
    .pipeTo(stream.sink((data) => t.is(data, "abc")))
})

test.serial("readable", "get()", async (t) => {
  t.timeout(1000)
  const actual = (
    await stream.collect(
      http
        .source("/tests/fixtures/stream/data.json")
        .pipeThrough(stream.pipe.text()),
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
  const actual = await stream.collect(
    stream
      .wrap(stream.source(["ab", "c"]), { before: "[", after: "]" })
      .pipeThrough(stream.pipe.text()),
  )

  t.is(actual, "[abc]")
})

// don't work with "node:stream/web"
test.noop("transform", "arrayBuffer() + text()", async (t) => {
  const actual = await stream.collect(
    stream.source
      .array(["hello \ud83c", "\udf0d"])
      .pipeThrough(stream.pipe.arrayBuffer())
      .pipeThrough(stream.pipe.text()),
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
      await stream.collect(
        stream.source
          .array(source)
          .pipeThrough(stream.pipe.text())
          .pipeThrough(stream.pipe.arrayBuffer())
          .pipeThrough(stream.pipe.text()),
      ),
      "h🌍",
    )
  }
})

test("transform", "each()", async (t) => {
  t.plan(2)
  const expected = ["a", "b"]
  await stream
    .source(["a", "b"])
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.each((item, i) => t.is(item, expected[i])))
    .pipeTo(stream.sink())
})

test("transform", "map()", async (t) => {
  t.plan(3)
  await stream
    .source(["a", "b"])
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.map((item) => item + "!"))
    .pipeThrough(stream.pipe.each((item) => t.true(/[ab]!/.test(item))))
    .pipeTo(stream.sink((item) => t.is(item, "a!b!")))
})

test("transform", "map()", 2, async (t) => {
  t.plan(1)
  await stream
    .source(["💦", "💦"])
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.map((item) => item + "!"))
    .pipeTo(stream.sink((item) => t.is(item, "💦!💦!")))
})

test("transform", "split() + join()", async (t) => {
  t.plan(1)
  await stream
    .source(["a\nb\n", "c\nd"])
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.split("\n"))
    .pipeThrough(stream.pipe.join("+"))
    .pipeTo(stream.sink((item) => t.is(item, "a+b+c+d")))
})

test("transform", "split() + join()", "include: true", async (t) => {
  t.plan(1)
  await stream
    .source(["a\nb\n", "c\nd"])
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.split("\n", { include: true }))
    .pipeThrough(stream.pipe.join("+"))
    .pipeTo(stream.sink((item) => t.is(item, `a\n+b\n+c\n+d`)))
})

test("transform", "slice()", async (t) => {
  t.plan(3)
  const chunks = ["cd", "efgh"]
  await stream
    .source(["abcd", "efghijk"])
    .pipeThrough(stream.pipe.slice(2, 8))
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.each((chunk) => t.is(chunk, chunks.shift())))
    .pipeTo(stream.sink((item) => t.is(item, `cdefgh`)))
})

test("transform", "slice()", "optional end param", async (t) => {
  t.plan(1)
  await stream
    .source(["abcd", "efghijk"])
    .pipeThrough(stream.pipe.slice(2))
    .pipeThrough(stream.pipe.text())
    .pipeTo(stream.sink((item) => t.is(item, `cdefghijk`)))
})

test("transform", "pipeline()", async (t) => {
  t.plan(1)
  await stream
    .source(["💦", "💦"])
    .pipeThrough(
      stream.pipeline([
        stream.pipe.text(), //
        stream.pipe.map((item) => item + "!"),
        stream.pipe.map((item) => item + "?"),
      ]),
    )
    .pipeTo(stream.sink((item) => t.is(item, "💦!?💦!?")))
})

test("transform", "pipeline()", "with readable", async (t) => {
  t.plan(1)
  await stream
    .pipeline([
      stream.source(["💦", "💦"]),
      stream.pipe.text(),
      stream.pipe.map((item) => item + "!"),
      stream.pipe.map((item) => item + "?"),
    ])
    .pipeTo(stream.sink((item) => t.is(item, "💦!?💦!?")))
})

test("transform", "text() + arrayBuffer()", async (t) => {
  const bytes = [97, 98, 99]
  const chunks = ["ab", "c"]
  let i = 0
  let j = 0

  t.plan(1 + chunks.length + bytes.length)

  await stream
    .source(chunks)
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.each((x) => t.is(x, chunks[i++])))
    .pipeThrough(stream.pipe.arrayBuffer())
    .pipeThrough(
      stream.pipe.each((x) => {
        for (const byte of x) t.is(byte, bytes[j++])
      }),
    )
    .pipeThrough(stream.pipe.text())
    .pipeTo(stream.sink((item) => t.is(item, "abc")))
})

test("transform", "cut()", async (t) => {
  t.plan(2)

  const chunks = [new Uint8Array(42), new Uint8Array(42)]
  chunks[0].fill(1)
  chunks[1].fill(2)

  const expected = combineArrayBufferView(...chunks).buffer

  const parts = []

  await stream.source
    .array(chunks)
    .pipeThrough(stream.pipe.cut(20))
    .pipeThrough(stream.pipe.each((x) => parts.push(x.length)))
    .pipeTo(stream.sink((item) => t.eq(item, expected)))

  t.eq(parts, [20, 20, 20, 20, 4])
})

test("transform", "cut()", "exact: true", async (t) => {
  t.plan(2)

  const chunks = [new Uint8Array(42), new Uint8Array(42)]
  chunks[0].fill(1)
  chunks[1].fill(2)

  const expected = combineArrayBufferView(...chunks).buffer

  const parts = []

  await stream.source
    .array(chunks)
    .pipeThrough(stream.pipe.cut(20, { exact: false }))
    .pipeThrough(stream.pipe.each((x) => parts.push(x.length)))
    .pipeTo(stream.sink((item) => t.eq(item, expected)))

  t.eq(parts, [20, 20, 2, 20, 20, 2])
})

if ("CompressionStream" in globalThis) {
  test.serial("transform", "compress() + decompress()", async (t) => {
    t.timeout(1000)
    const original = new TextEncoder().encode("💦💦")

    const compressed = await stream.collect(
      stream.source(["💦", "💦"]).pipeThrough(stream.pipe.compress()),
    )

    t.true(
      original.byteLength < compressed.byteLength,
      "less byteLength in compressed",
    )

    const decompressed = await stream.collect(
      stream.source(compressed).pipeThrough(stream.pipe.decompress()),
    )

    t.true(
      original.byteLength === decompressed.byteLength,
      "decompressed byteLength is equal to original byteLength",
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
    .pipeThrough(stream.pipe.text())
    .pipeThrough(stream.pipe.split(/(?:\r?\n)+/))
    .pipeThrough(
      stream.pipe.each((val, i) => t.eq(JSON.parse(val), expecteds[i])),
    )
    .pipeTo(stream.sink())
})
