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
    task({ path: "x/y", val: 1, options: "/", expected: { x: { y: 1 } } }),
    task({ path: "/x/y", val: 1, options: "/", expected: { x: { y: 1 } } }),
    task({ path: "/x/y/", val: 1, options: "/", expected: { x: { y: 1 } } }),
  ],
  (test, { obj, path, val, expected, options }) => {
    test(path, (t) => {
      t.eq(allocate(obj ?? {}, path, val, options), expected)
    })
  }
)
