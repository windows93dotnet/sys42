import test from "../../../42/test.js"
import configure from "../../../42/core/configure.js"

test("deep merge options", (t) => {
  const defaults = t.stays({
    a: 1,
    b: {
      x: [{ a: 2 }],
      y: [{ a: 3 }],
      z: "!",
    },
  })
  const options = t.stays({
    a: "1",
    b: { y: [false] },
    c: 3,
  })
  const expected = {
    a: "1",
    b: {
      x: [{ a: 2 }],
      y: [false],
      z: "!",
    },
    c: 3,
  }
  const config = configure(defaults, options)
  t.eq(config, expected)
})

test("functions", (t) => {
  const a = () => 1
  const b = () => 2
  const target = configure({}, { x: a }, { x: b })
  t.is(target.x, b)
  t.is(target.x(), 2)
})

test("multiple sources", (t) => {
  t.eq(
    configure(
      t.stays({ foo: 0 }),
      t.stays({ bar: 1, baz: 3 }),
      t.stays({ bar: 2 })
    ),
    { foo: 0, bar: 2, baz: 3 }
  )
  t.eq(configure({}, {}, { foo: 1 }), { foo: 1 })
})

test("clone option objects", (t) => {
  const plainObj1 = t.stays({ value: "foo" })
  const plainObj2 = t.stays({ value: "bar" })
  const result = configure({ array: [plainObj1] }, { array: [plainObj2] })
  t.eq(result.array[0], plainObj2)
  t.not(result.array[0], plainObj1)
  t.not(result.array[0], plainObj2)
})

test("ignore `undefined`", (t) => {
  t.eq(configure(undefined), {})
  const expected = { foo: false }
  t.eq(configure(undefined, { foo: true }, { foo: false }), expected)
  t.eq(configure({ foo: true }, undefined, { foo: false }), expected)
  t.eq(configure({ foo: true }, { foo: false }, undefined), expected)
})

test("ignore `null`", (t) => {
  t.eq(configure(null), {})
  const expected = { foo: false }
  t.eq(configure(null, { foo: true }, { foo: false }), expected)
  t.eq(configure({ foo: true }, null, { foo: false }), expected)
  t.eq(configure({ foo: true }, { foo: false }, null), expected)
})

test("support `undefined` Option Values", (t) => {
  t.eq(configure({ foo: true }, { foo: undefined }), {
    foo: undefined,
  })
})

test("support undefined as target, null as source", (t) => {
  const result = configure({ foo: undefined }, { foo: null })
  t.is(result.foo, null)
})

test("support null as target, undefined as source", (t) => {
  const result = configure({ foo: null }, { foo: undefined })
  t.is(result.foo, undefined)
})

test("throw TypeError on non-option-objects", async (t) => {
  for (const value of [
    42,
    "string",
    new Date(),
    new Map(),
    new Set(),
    Promise.resolve(),
    Symbol("symbol"),
    /regexp/,
    function () {},
  ]) {
    const msg = `for: configure(${t.utils.stringify(value)})`
    t.throws(() => configure(value), TypeError, msg)
    t.throws(() => configure({}, value), TypeError, msg)
    t.throws(() => configure({ foo: "bar" }, value), TypeError, msg)
  }
})
