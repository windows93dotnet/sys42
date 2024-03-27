// @src https://github.com/vfile/vfile-location/blob/main/test.js

import test from "../../../../../42/test.js"
import textPosition from "../../../../../42/fabric/type/string/textPosition.js"

test("textPosition()", (t) => {
  const place = textPosition("")
  t.is(typeof place.toOffset, "function")
  t.is(typeof place.toOffset, "function")
})

test("place.toOffset(point)", (t) => {
  const tp = textPosition("foo\nbar\nbaz")

  t.is(
    tp.toOffset({ line: undefined, column: undefined }),
    -1,
    "should return `-1` for invalid input",
  )

  t.is(
    tp.toOffset({ line: 4, column: 2 }),
    -1,
    "should return `-1` for out of bounds input",
  )

  t.is(tp.toOffset({ line: 2, column: 2 }), 5, "should return an offset (#1)")

  t.is(tp.toOffset({ line: 1, column: 1 }), 0, "should return an offset (#2)")

  t.is(tp.toOffset({ line: 3, column: 4 }), 11, "should return an offset (#3)")
})

test("place.toPoint(offset)", (t) => {
  const tp = textPosition("foo\nbar\nbaz")

  t.eq(
    tp.toPoint(-1),
    { line: undefined, column: undefined },
    "should return an empty object for invalid input",
  )

  t.eq(
    tp.toPoint(12),
    { line: undefined, column: undefined },
    "should return an empty object for out of bounds input",
  )

  t.eq(
    tp.toPoint(0), //
    { line: 1, column: 1 },
    "should return a point (#1)",
  )

  t.eq(
    tp.toPoint(11), //
    { line: 3, column: 4 },
    "should return a point (#2)",
  )
})

test("other tests", (t) => {
  let tp = textPosition("foo")

  t.eq(
    [tp.toPoint(3), tp.toPoint(4), tp.toPoint(5)],
    [
      { line: 1, column: 4 },
      { line: undefined, column: undefined },
      { line: undefined, column: undefined },
    ],
    "should return points for offsets around an EOF w/o EOLs",
  )

  t.eq(
    [
      tp.toOffset({ line: 1, column: 4 }),
      tp.toOffset({ line: 2, column: 1 }),
      tp.toOffset({ line: 2, column: 2 }),
    ],
    [3, -1, -1],
    "should return offsets for points around an EOF w/o EOLs",
  )

  tp = textPosition("foo\n")

  t.eq(
    [tp.toPoint(3), tp.toPoint(4), tp.toPoint(5)],
    [
      { line: 1, column: 4 },
      { line: 2, column: 1 },
      { line: undefined, column: undefined },
    ],
    "should return points for offsets around an EOF EOL",
  )

  t.eq(
    [
      tp.toOffset({ line: 1, column: 4 }),
      tp.toOffset({ line: 2, column: 1 }),
      tp.toOffset({ line: 2, column: 2 }),
    ],
    [3, 4, -1],
    "should return offsets for points around an EOF EOL",
  )

  tp = textPosition("foo\rbar")

  t.eq(
    [tp.toPoint(3), tp.toPoint(4), tp.toPoint(5)],
    [
      { line: 1, column: 4 },
      { line: 2, column: 1 },
      { line: 2, column: 2 },
    ],
    "should return points for offsets around carriage returns",
  )

  t.eq(
    [
      tp.toOffset({ line: 1, column: 4 }),
      tp.toOffset({ line: 2, column: 1 }),
      tp.toOffset({ line: 2, column: 2 }),
    ],
    [3, 4, 5],
    "should return offsets for points around carriage returns",
  )

  tp = textPosition("foo\r\nbar")

  t.eq(
    [tp.toPoint(3), tp.toPoint(4), tp.toPoint(5), tp.toPoint(6)],
    [
      { line: 1, column: 4 },
      { line: 1, column: 5 },
      { line: 2, column: 1 },
      { line: 2, column: 2 },
    ],
    "should return points for offsets around carriage returns + line feeds",
  )

  t.eq(
    [
      tp.toOffset({ line: 1, column: 4 }),
      tp.toOffset({ line: 2, column: 1 }),
      tp.toOffset({ line: 2, column: 2 }),
    ],
    [3, 5, 6],
    "should return offsets for points around carriage returns + line feeds",
  )
})

test("update", (t) => {
  const tp = textPosition("foo\nbar")

  t.is(tp.toOffset({ line: 2, column: 2 }), 5)
  t.is(tp.toOffset({ line: 3, column: 2 }), -1)

  tp.update("foo\nbar\nbaz")

  t.is(tp.toOffset({ line: 2, column: 2 }), 5)
  t.is(tp.toOffset({ line: 3, column: 2 }), 9)
})
