import test from "../../../../42/test.js"
import allocate from "../../../../42/fabric/locator/allocate.js"

const { task } = test

test.tasks(
  [
    task({ path: "", val: 1, expected: {} }),
    task({ path: "x", val: 1, expected: { x: 1 } }),
    task({ path: "x.y", val: 1, expected: { x: { y: 1 } } }),
    task({
      path: "x.y",
      val: 1,
      options: { hashmap: true },
      expected: { x: Object.assign(Object.create(null), { y: 1 }) },
    }),
    task({ path: "x.y", val: 1, options: "", expected: { "x.y": 1 } }),
    task({ obj: { a: 1 }, path: "b", val: 2, expected: { a: 1, b: 2 } }),
    task({ obj: { a: 1 }, path: ".", val: 2, expected: {} }),
    task({ obj: { a: 1 }, path: ".", val: { b: 2 }, expected: { b: 2 } }),
    task({ obj: { a: 1 }, path: "", val: { b: 2 }, expected: { b: 2 } }),
    task({ path: "x/y", val: 1, options: "/", expected: { x: { y: 1 } } }),
    task({ path: "/x/y", val: 1, options: "/", expected: { x: { y: 1 } } }),
    task({ path: "/x/y/", val: 1, options: "/", expected: { x: { y: 1 } } }),
  ],
  (test, { obj, path, val, expected, options }) => {
    test(path, (t) => {
      t.eq(allocate(obj ?? {}, path, val, options), expected)
    })
  },
)

test("proto", (t) => {
  const obj1 = {}
  const res1 = allocate(obj1, "__proto__.foo", "bar")
  t.isUndefined(Object.prototype.foo)
  t.eq(res1, { foo: "bar" })

  const obj2 = {}
  const res2 = allocate(obj2, "constructor.foo", "bar")
  t.isUndefined(Object.foo)
  t.eq(Object.keys(res2), ["constructor"])
  t.eq(res2, { constructor: { foo: "bar" } })

  const obj3 = {}
  const res3 = allocate(obj3, "__proto__", "bar")
  t.eq(res3, {})

  const obj4 = {}
  const res4 = allocate(obj4, "constructor", "bar")
  t.eq(Object.keys(res4), ["constructor"])
  t.eq(res4, { constructor: "bar" })
  res4.constructor = "baz"
  t.eq(res4, { constructor: "baz" })
})
