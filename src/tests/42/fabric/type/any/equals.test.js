import test from "../../../../../42/test.js"
import equals from "../../../../../42/fabric/type/any/equals.js"

test("simple", (t) => {
  t.true(equals(3, 3))
  t.true(equals(undefined, undefined))
  t.true(equals(null, null))
  t.true(equals("derp", "derp"))
  t.true(equals([], []))
  t.true(equals({}, {}))
  t.true(equals([], new Array()))
  t.true(equals({}, new Object()))
  t.true(equals({ a: [2, 3], b: [4] }, { a: [2, 3], b: [4] }))

  t.false(equals({ x: 5, y: [6] }, { x: 5, y: 6 }))
  t.false(equals([{ a: 3 }, { b: 4 }], [{ a: "3" }, { b: "4" }]))
  t.false(equals("3", 3))
  t.false(equals("3", [3]))
  t.false(equals(undefined, null))
})

test("don't mutate", (t) => {
  let a
  let b

  a = t.stays("3")
  b = t.stays(3)
  t.true(equals(a, a))
  t.false(equals(a, b))

  a = t.stays(["3"])
  b = t.stays([3])
  t.true(equals(a, a))
  t.false(equals(a, b))

  a = t.stays({ a: "3" })
  b = t.stays({ a: 3 })
  t.true(equals(a, a))
  t.false(equals(a, b))
})

test("0 -0", (t) => {
  t.false(equals(0, -0))
  t.true(equals(new Set([0]), new Set([-0])))
})

test("Object.create(null)", (t) => {
  const actual = Object.create(null)
  actual.a = 1
  actual.b = 2
  t.true(equals(actual, Object.assign(Object.create(null), { a: 1, b: 2 })))

  t.false(equals(actual, { a: 1, b: 2 }))
})

test("Object.create(null)", "{proto:false}", (t) => {
  const options = { proto: false }
  const actual = Object.create(null)
  actual.a = 1
  actual.b = 2
  t.true(
    equals(actual, Object.assign(Object.create(null), { a: 1, b: 2 }), options)
  )
  t.true(equals(actual, { a: 1, b: 2 }, options))

  t.false(
    equals(actual, Object.assign(Object.create(null), { a: 1, b: 3 }), options)
  )
  t.false(equals(actual, { a: 1, b: 3 }, options))
})

test("sparse Array", (t) => {
  const arr = new Array()
  arr[3] = "string"
  t.true(equals(arr, [, , , "string"]))
  t.true(equals([, , ,], [, , ,]))
  t.true(equals([null, null, null], [null, null, null]))
  t.true(equals([undefined, undefined], [undefined, undefined]))

  t.false(equals([, , ,], [undefined, undefined, undefined]))
  t.false(equals([, , ,], [null, null, null]))
})

test("key order in object don't matter", (t) => {
  const a = {
    x: 1,
    y: 2,
  }
  const b = {
    y: 2,
    x: 1,
  }
  t.true(equals(a, b))
})

test("function with different declaration name are not equal", (t) => {
  t.true(
    equals(
      () => 1,
      () => 1
    )
  )

  const a = () => 1
  const b = () => 1
  t.false(equals(a, b))
})

test("function with different declaration name are not equal", 2, (t) => {
  const a = {
    x: () => 1,
  }
  const b = {
    y: () => 1,
  }
  t.false(equals(a.x, b.y))
})

test("references Object", (t) => {
  let a
  let b
  a = { x: 1 }
  a.y = a.x
  b = { x: 1 }
  b.y = b.x
  t.true(equals(a, b))

  a = { x: 1 }
  a.y = a.x
  b = { x: 1 }
  b.y = { x: 1 }
  t.false(equals(a, b))
})

const symbolA = Symbol("a")
const symbolB = Symbol("b")

class MyObject {
  constructor() {
    this.derp = 1
  }
}
class MyArray extends Array {
  constructor(...args) {
    super(...args)
    this.derp = 1
  }
}

const { task } = test

const tasks = [
  task({
    title: "primitives",
    pass: [
      [0, 0],
      [1, 1],
      [BigInt("0x1fffffffffffff"), BigInt("0x1fffffffffffff")],
      [9_007_199_254_740_991n, 9_007_199_254_740_991n],
      [true, true],
      [false, false],
      ["a", "a"],
      [null, null],
      [Symbol.for("a"), Symbol.for("a")],
      [symbolA, symbolA],
    ],
    fail: [
      [0, 1],
      [0, "0"],
      [1, "1"],
      [BigInt("0x1fffffffffffff"), BigInt("0x1ffffffffffff0")],
      [9_007_199_254_740_991n, 9_007_199_254_740_990n],
      [true, 1],
      [true, "true"],
      [false, 0],
      [false, "false"],
      ["a", "b"],
      [null, void 0],
      [Symbol.for("a"), Symbol.for("b")],
      [symbolA, symbolB],
    ],
  }),

  task({
    title: "tricky",
    pass: [
      [Number.NaN, Number.NaN],
      [undefined, void 0],
      [Object.create(null), Object.create(null)],
      [new Array(1), new Array(1)],
    ],
    fail: [
      [{}, Object.create(null)], //
      [new Array(1), [undefined]],
    ],
  }),

  task({
    title: "function",
    pass: [
      [() => {}, () => {}],
      [(arg) => console.log(arg), (arg) => console.log(arg)], //
      [
        function x(arg) {
          console.log(arg)
        },
        function x(arg) {
          console.log(arg)
        },
      ],
    ],
    fail: [
      [(arg) => console.log(arg), (param) => console.log(param)], //
      [
        function x(arg) {
          console.log(arg)
        },
        function y(arg) {
          console.log(arg)
        },
      ],
    ],
  }),

  task({
    title: "extended objects",
    pass: [
      [new MyObject(), new MyObject()],
      [new MyArray(1, 2, 3), new MyArray(1, 2, 3)],
    ],
    fail: [
      [{ derp: 1 }, new MyObject()],
      [new MyObject(1, 2, 4), new MyArray(1, 2, 3)],
      [new Array(), new MyArray()],
      [[1, 2, 3], new MyArray(1, 2, 3)],
    ],
  }),

  task({
    title: "Map",
    pass: [
      [new Map(), new Map()],
      [new Map([["a", 1]]), new Map([["a", 1]])],
      [
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
      ],
    ],
    fail: [
      [new Map(), new Map([["a", 1]])],
      [new Map([["a", 1]]), new Map([["a", 2]])],
      [
        new Map([
          ["b", 2],
          ["a", 1],
        ]),
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
      ],
      [
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
        new Map([
          ["a", 2],
          ["b", 2],
        ]),
      ],
      [
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
        new Map([
          ["a", 1],
          ["b", 2],
          ["c", 3],
        ]),
      ],
    ],
  }),

  task({
    title: "Set",
    pass: [
      [new Set(), new Set()],
      [new Set(["a", 1]), new Set(["a", 1])],
    ],
    fail: [
      [new Set(), new Set(["a", 1])],
      [new Set(["a", 1]), new Set(["a", 1, "b"])],
      [new Set(["a", 1]), new Set(["a", 2])],
      [new Set(["a", 1]), new Set([1, "a"])],
    ],
  }),

  task({
    title: "Date",
    pass: [
      [
        new Date(1_387_585_278_000),
        new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
      ],
    ],
    fail: [
      [new Date(1_387_585_278_000), new Date()], //
    ],
  }),

  task({
    title: "RegExp",
    pass: [
      [/a/, /a/],
      [/a/i, /a/i],
      [/a/i, new RegExp("a", "i")],
    ],
    fail: [
      [/a/i, "/a/"],
      [/a/i, /a/],
      [/a/i, /a/gi],
      [/a/i, /b/i],
      [/a/, /b/],
    ],
  }),

  task({
    title: "TypedArray",
    sameAsClone: true,
    pass: [
      [new Uint8Array(), new Uint8Array()], //
      [Uint8Array.from([1, 2]), Uint8Array.from([1, 2])],
    ],
    fail: [
      [new Uint8Array(), new Uint8Array(1)], //
      [Uint8Array.from([1, 2]), Uint8Array.from([1, 2, 3])],
      [Uint8Array.from([1, 2]), Uint8Array.from([1, 3])],
    ],
  }),

  task({
    title: "ArrayBuffer",
    sameAsClone: true,
    pass: [
      [new Uint8Array().buffer, new Uint8Array().buffer], //
      [Uint8Array.from([1, 2]).buffer, Uint8Array.from([1, 2]).buffer],
    ],
    fail: [
      [new Uint8Array().buffer, new Uint8Array(1).buffer], //
      [Uint8Array.from([1, 2]).buffer, Uint8Array.from([1, 2, 3]).buffer],
      [Uint8Array.from([1, 2]).buffer, Uint8Array.from([1, 3]).buffer],
    ],
  }),
]

{
  const a1 = {}
  a1.x = a1
  const b1 = {}
  b1.x = b1

  const a2 = { x: {} }
  a2.x.y = a2
  const b2 = { x: {} }
  b2.x.y = b2

  const a3 = {}
  a3.x = a3
  const b3 = {}
  b3.x = b3
  b3.y = 1

  const a4 = { y: {} }
  a4.x = a4
  const b4 = { y: {} }
  b4.y.x = b4

  tasks.push(
    task({
      title: "circular Object",
      pass: [
        [a1, b1], //
        [a2, b2],
      ],
      fail: [
        [a3, b3], //
        [a4, b4],
      ],
    })
  )
}

{
  const a1 = []
  a1.push(a1)
  const b1 = []
  b1.push(b1)

  const a2 = { x: [] }
  a2.x.push(a2)
  const b2 = { x: [] }
  b2.x.push(b2)

  const a3 = []
  a3.push(a3)
  const b3 = []
  b3.push(b3, 1)

  tasks.push(
    task({
      title: "circular Array",
      pass: [
        [a1, b1], //
        [a2, b2],
      ],
      fail: [
        [a3, b3], //
      ],
    })
  )
}

{
  const a1 = new Map()
  a1.set("x", a1)
  const b1 = new Map()
  b1.set("x", b1)

  const a2 = { x: new Map() }
  a2.x.set("circular", a2)
  const b2 = { x: new Map() }
  b2.x.set("circular", b2)

  const a3 = new Map()
  a3.set("x", a3)
  const b3 = new Map()
  b3.set("x", b3)
  b3.set("y", 1)

  tasks.push(
    task({
      title: "circular Map",
      pass: [
        [a1, b1], //
        [a2, b2], //
      ],
      fail: [
        [a3, b3], //
      ],
    })
  )
}

{
  const a1 = new Set()
  a1.add(a1)
  const b1 = new Set()
  b1.add(b1)

  const a2 = { x: new Set() }
  a2.x.add(a2)
  const b2 = { x: new Set() }
  b2.x.add(b2)

  const a3 = new Set()
  a3.add(a3)
  const b3 = new Set()
  b3.add(b3)
  b3.add(2)

  tasks.push(
    task({
      title: "circular Set",
      pass: [
        [a1, b1], //
        [a2, b2], //
      ],
      fail: [
        [a3, b3], //
      ],
    })
  )
}

if ("Node" in globalThis) {
  tasks.push(
    task({
      title: "Node",
      pass: [
        [document.createElement("div"), document.createElement("div")], //
        [
          Object.assign(document.createElement("div"), { id: "x" }),
          Object.assign(document.createElement("div"), { id: "x" }),
        ],
      ],
      fail: [
        [document.createElement("div"), document.createElement("span")],
        [
          Object.assign(document.createElement("div"), { id: "x" }),
          Object.assign(document.createElement("div"), { id: "y" }),
        ],
      ],
    })
  )
}

if ("Blob" in globalThis) {
  tasks.push(
    task({
      title: "Blob",
      pass: [
        [
          new Blob(["ab"], { type: "text/plain" }),
          new Blob(["ab"], { type: "text/plain" }),
        ],
      ],
      fail: [
        [
          new Blob(["xx"], { type: "text/plain" }),
          new Blob(["xx"], { type: "text/html" }),
        ],
      ],
    })
  )
}

if ("File" in globalThis) {
  tasks.push(
    task({
      title: "File",
      pass: [
        [
          new File(["ab"], "x", { type: "text/plain", lastModified: 1 }),
          new File(["ab"], "x", { type: "text/plain", lastModified: 1 }),
        ],
      ],
      fail: [
        [
          new File(["ab"], "x", { type: "text/plain", lastModified: 1 }),
          new File(["ab"], "y", { type: "text/plain", lastModified: 1 }),
        ],
        [
          new File(["ab"], "x", { type: "text/plain", lastModified: 1 }),
          new File(["ab"], "x", { type: "text/html", lastModified: 1 }),
        ],
        [
          new File(["ab"], "x", { type: "text/plain", lastModified: 1 }),
          new File(["ab"], "x", { type: "text/plain", lastModified: 2 }),
        ],
      ],
    })
  )
}

function runTask({ test, title }, assert, a, b) {
  test.serial(title, assert, a, b, (t) => {
    t.timeout(2000)
    t[assert](equals(a, b))
    t[assert](equals({ a }, { a: b }), "in object")
    t[assert](equals([a], [b]), "in array")
    t[assert](equals(new Map([["a", a]]), new Map([["a", b]])), "in map")
    t[assert](equals(new Set([a]), new Set([b])), "in set")
    t[assert](
      equals(
        { x: [{ a }], y: new Map([["a", a]]), z: new Set([a]) },
        { x: [{ a: b }], y: new Map([["a", b]]), z: new Set([b]) }
      ),
      "in complex"
    )
  })
}

test.tasks(tasks, (test, { title, pass, fail, sameAsClone }) => {
  for (const [a, b] of pass) {
    runTask({ test, title }, "true", a, b)
    if (a && b) {
      const clonedA = Object.assign(test.utils.clone(a), { foo: "foo" })
      const clonedB = Object.assign(test.utils.clone(b), { foo: "foo" })
      runTask({ test, title }, "true", clonedA, clonedB)
      if (sameAsClone !== true) runTask({ test, title }, "false", clonedA, b)
    }
  }

  for (const [a, b] of fail) {
    runTask({ test, title }, "false", a, b)
  }
})
