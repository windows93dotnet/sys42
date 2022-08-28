/* eslint-disable no-new-wrappers */
/* eslint-disable unicorn/new-for-builtins */

import test from "../../../../../42/test.js"
import clone from "../../../../../42/fabric/type/any/clone.js"

const PRIMITIVES = [
  true,
  false,
  null,
  undefined,
  "a",
  1,
  Number.NaN,
  Infinity,
  -Infinity,
  Symbol.for("clone test"),
  Symbol("clone test"),
]

PRIMITIVES.forEach((x) => {
  test(x, (t) => {
    t.is(clone.shallow(x), x)
    t.is(clone(x), x)
  })
})

// TODO: add this kind of objects to stringify.js
const OBJECT_WITH_VALUE_OF = [
  /a/i,
  new Date(),
  new Boolean(false),
  new Number(42),
  new String("derp"),
]

OBJECT_WITH_VALUE_OF.forEach((x) => {
  test(x, (t) => {
    const cs = clone.shallow(x)
    const c = clone(x)
    t.not(cs, x)
    t.not(c, x)
    t.eq(cs, x)
    t.eq(c, x)
  })
})

const REFERENCEABLES = {
  0: [1, 2, 3],
  1: [1, 2, [3]],
  2: { a: 1, b: 2 },
  3: { a: 1, b: { c: 2 } },
  4: new Set([1, 2, 3]),
  5: new Set([1, 2, [3]]),
  6: new Set([1, 2, new Set([3])]),
  7: new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]),
  8: new Map([
    ["a", 1],
    ["b", new Map([["c", 3]])],
  ]),
}

Object.values(REFERENCEABLES).forEach((expected) => {
  test(expected, (t) => {
    const actual = clone(expected)
    t.eq(actual, expected)
    t.not(actual, expected)
  })
})

test("Object.create(null)", (t) => {
  t.eq(clone.shallow(Object.create(null)), Object.create(null))
  t.notEq(clone.shallow({}), Object.create(null))
  t.eq(clone(Object.create(null)), Object.create(null))
})

test("clone.shallow - any", (t) => {
  t.eq(clone.shallow({ a: 1 }), {})
  t.eq(clone.shallow([1, 2, 3]), new Array(3))
  t.eq(clone.shallow(new Set([1, 2, 3])), new Set())
  t.eq(clone.shallow(new Map([["a", 1]])), new Map())
})

test("clone.shallow - array like", (t) => {
  t.eq(clone.shallow({ 0: "a", length: 1 }), {})
})

test("copy - any", (t) => {
  t.eq(clone({ a: 1 }), { a: 1 })
  t.eq(clone([1, 2, 3]), [1, 2, 3])
  t.eq(clone(new Set([1, 2, 3])), new Set([1, 2, 3]))
  t.eq(clone(new Map([["a", 1]])), new Map([["a", 1]]))
})

test("TypedArray", (t) => {
  const a = new Int8Array(8)
  a[0] = 42
  let b

  b = clone.shallow(a)
  t.eq(b, new Int8Array(8))
  t.is(b[0], 0)
  t.is(a[0], 42)

  b = clone(a)
  t.eq(b, a)
  t.is(b[0], 42)
  t.is(a[0], 42)
})

test("ArrayBuffer", (t) => {
  const { buffer } = new Uint8Array(new Array(256).fill(0).map((_, i) => i))
  t.eq(clone(buffer), buffer)
  const emptyBuffer = new Uint8Array(new Array(256).fill(0)).buffer
  t.eq(clone.shallow(buffer), emptyBuffer)
})

test("RegExp", (t) => {
  const a = /a/i

  const regexIsWorking = (a, b) => {
    t.not(a, b)
    t.is(b.flags, "i")
    t.is(b.source, "a")

    t.true(b.test("a"))
    t.true(b.test("A"))
    t.false(b.test("b"))
  }

  regexIsWorking(a, clone.shallow(a))
  regexIsWorking(a, clone(a))
})

test("references", (t) => {
  const x = { n: 1 }
  const a = { x, y: { x }, z: { $ref: "#/y" } }
  a.circular = a
  const b = clone(a)
  t.not(b, a)
  t.not(b.x, x)
  t.not(b.y.x, x)
  t.eq(b.x, x)
  t.eq(b.y.x, x)
  t.is(b.y.x, b.x)
  t.is(b.circular, b)
  t.eq(b.z, { $ref: "#/y" }) // ignore previous $ref
})

test("references in array", (t) => {
  const x = [1]
  const a = [x, x]
  a.push(a)
  const b = clone(a)
  t.not(b, a)
  t.not(b[0], x)
  t.eq(b[0], x)
  t.eq(b[0], b[1])
  t.is(b[0], b[1])
  t.is(b[2], b)
})

test("references in Set", (t) => {
  const x = new Set([1])
  const a = new Set([x])
  a.add(a)
  const b = clone(a)
  t.is(b.size, 2)
  t.not(b, a)
  const values = [...b.values()]
  t.not(values[0], x)
  t.eq(values[0], x)
  t.is(values[1], b)
})

test("references in Map", (t) => {
  const x = new Map([["y", 1]])
  const a = new Map([["x", x]])
  a.set("circular", a)
  const b = clone(a)
  t.is(b.size, 2)
  t.not(b, a)
  t.not(b.get("x"), x)
  t.eq(b.get("x"), x)
  t.is(b.get("circular"), b)
})

test("Promise", "resolve", async (t) => {
  const a = Promise.resolve(1)
  const b = clone(a)
  t.not(a, b)
  t.eq(a, b)
  t.is(await b, 1)
})

test("Promise", "resolve", "shallow", async (t) => {
  const x = { a: 1 }
  const a = Promise.resolve(x)
  const b = clone.shallow(a)
  t.not(a, b)
  t.eq(a, b)
  const y = await b
  t.is(x, y)
})

test("Promise", "resolve", "deep", async (t) => {
  const x = { a: 1 }
  const a = Promise.resolve(x)
  const b = clone(a)
  t.not(a, b)
  t.eq(a, b)
  const y = await b
  t.not(x, y)
  t.eq(x, y)
})

test("Promise", "reject", async (t) => {
  const stays = Promise.reject(new Error("boom"))
  const a = Promise.reject(new Error("boom"))
  const b = clone(a)
  t.eq(a, stays)
  t.not(a, b)
  t.eq(a, b)
  const x = await t.throws(a)
  const y = await t.throws(b)
  t.is(x, y)
  stays.catch(test.utils.noop)
})

test("function", (t) => {
  const a = (arg) => 5 + arg
  t.stays(a)
  const b = clone(a)

  t.not(b, a)
  t.eq(b, a)
  t.is(a(1), 6)
  t.is(b(1), 6)
  b.foo = 1
  t.isUndefined(a.foo)
})

test("function", 2, (t) => {
  const a = {
    x: 2,
    y(arg) {
      return this.x + arg
    },
  }
  const b = clone(a)
  t.not(a.y, b.y)
  t.eq(a.y, b.y)
  t.is(a.y(1), 3)
  t.is(b.y(1), 3)
  t.isUndefined(a.foo)
})

test("Math", (t) => {
  const a = clone(t.stays(Math))
  t.is(a.sin(1), Math.sin(1))
  t.not(a.sin, Math.sin)
  t.eq(a.sin, Math.sin)
  t.not(a, Math)
})

if (test.env.runtime.inFrontend) {
  test("Blob", async (t) => {
    t.timeout(1000)
    const a = new Blob(["<h1>hello</h1>"], { type: "test/html" })
    const cloned = clone(a)
    t.eq(cloned, a)
    t.eq(await new Response(cloned).text(), await new Response(a).text())
  })

  test("File", async (t) => {
    t.timeout(1000)
    const a = new File(["<h1>hello</h1>"], "index.html", { type: "test/html" })
    const cloned = clone(a)
    t.eq(cloned, a)
    t.eq(await new Response(cloned).text(), await new Response(a).text())
  })

  test("document", (t) => {
    const a = clone.shallow(document)
    t.not(a, document)
    t.true(a instanceof HTMLDocument)
  })

  test("element", (t) => {
    const el = document.createElement("span")
    el.id = "x"
    el.className = "a b"
    el.innerHTML = "derp"
    el.foo = "bar"
    const a = clone(el)
    t.not(a, el)
    t.true(a instanceof HTMLElement)
    t.is(a.id, "x")
    t.is(a.className, "a b")
    t.is(a.innerHTML, "derp")
    t.is(a.outerHTML, '<span id="x" class="a b">derp</span>')
    t.is(a.foo, "bar")
    t.eq(a, el)
  })
}
