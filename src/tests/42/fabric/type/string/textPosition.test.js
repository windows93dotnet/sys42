// @src https://github.com/vfile/vfile-location/blob/main/test.js

import test from "../../../../../42/test.js"
import textPosition from "../../../../../42/fabric/type/string/textPosition.js"

test("textPosition()", (t) => {
  const place = textPosition("")
  t.is(typeof place.toOffset, "function", "should expose `toOffset` for `doc`")
  t.is(typeof place.toOffset, "function", "should expose `toPoint` for `doc`")
})

test("place.toOffset(point)", (t) => {
  const place = textPosition("foo\nbar\nbaz")

  t.is(
    place.toOffset({ line: undefined, column: undefined }),
    -1,
    "should return `-1` for invalid input",
  )

  t.is(
    place.toOffset({ line: 4, column: 2 }),
    -1,
    "should return `-1` for out of bounds input",
  )

  t.is(
    place.toOffset({ line: 2, column: 2 }),
    5,
    "should return an offset (#1)",
  )

  t.is(
    place.toOffset({ line: 1, column: 1 }),
    0,
    "should return an offset (#2)",
  )

  t.is(
    place.toOffset({ line: 3, column: 4 }),
    11,
    "should return an offset (#3)",
  )
})

test("place.toPoint(offset)", (t) => {
  const place = textPosition("foo\nbar\nbaz")

  t.eq(
    place.toPoint(-1),
    { line: undefined, column: undefined },
    "should return an empty object for invalid input",
  )

  t.eq(
    place.toPoint(12),
    { line: undefined, column: undefined },
    "should return an empty object for out of bounds input",
  )

  t.eq(
    place.toPoint(0), //
    { line: 1, column: 1 },
    "should return a point (#1)",
  )

  t.eq(
    place.toPoint(11), //
    { line: 3, column: 4 },
    "should return a point (#2)",
  )
})

test("other tests", (t) => {
  let place = textPosition("foo")

  t.eq(
    [place.toPoint(3), place.toPoint(4), place.toPoint(5)],
    [
      { line: 1, column: 4 },
      { line: undefined, column: undefined },
      { line: undefined, column: undefined },
    ],
    "should return points for offsets around an EOF w/o EOLs",
  )

  t.eq(
    [
      place.toOffset({ line: 1, column: 4 }),
      place.toOffset({ line: 2, column: 1 }),
      place.toOffset({ line: 2, column: 2 }),
    ],
    [3, -1, -1],
    "should return offsets for points around an EOF w/o EOLs",
  )

  place = textPosition("foo\n")

  t.eq(
    [place.toPoint(3), place.toPoint(4), place.toPoint(5)],
    [
      { line: 1, column: 4 },
      { line: 2, column: 1 },
      { line: undefined, column: undefined },
    ],
    "should return points for offsets around an EOF EOL",
  )

  t.eq(
    [
      place.toOffset({ line: 1, column: 4 }),
      place.toOffset({ line: 2, column: 1 }),
      place.toOffset({ line: 2, column: 2 }),
    ],
    [3, 4, -1],
    "should return offsets for points around an EOF EOL",
  )

  place = textPosition("foo\rbar")

  t.eq(
    [place.toPoint(3), place.toPoint(4), place.toPoint(5)],
    [
      { line: 1, column: 4 },
      { line: 2, column: 1 },
      { line: 2, column: 2 },
    ],
    "should return points for offsets around carriage returns",
  )

  t.eq(
    [
      place.toOffset({ line: 1, column: 4 }),
      place.toOffset({ line: 2, column: 1 }),
      place.toOffset({ line: 2, column: 2 }),
    ],
    [3, 4, 5],
    "should return offsets for points around carriage returns",
  )

  place = textPosition("foo\r\nbar")

  t.eq(
    [place.toPoint(3), place.toPoint(4), place.toPoint(5), place.toPoint(6)],
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
      place.toOffset({ line: 1, column: 4 }),
      place.toOffset({ line: 2, column: 1 }),
      place.toOffset({ line: 2, column: 2 }),
    ],
    [3, 5, 6],
    "should return offsets for points around carriage returns + line feeds",
  )
})
