import test from "../../../../../42/test.js"
import diff from "../../../../../42/fabric/json/diff.js"
import patch from "../../../../../42/fabric/json/patch.js"

// @src https://github.com/gregsexton/json-patch-gen/blob/master/test/diff.js

test("don't throws when given something other than an object or array", (t) => {
  t.eq(diff({}, "a"), [{ op: "replace", path: "", value: "a" }])
  t.eq(diff({}, null), [{ op: "replace", path: "", value: null }])
  t.eq(diff({}, 1), [{ op: "replace", path: "", value: 1 }])
  t.eq(diff({}, []), [{ op: "replace", path: "", value: [] }])

  t.eq(diff("a", {}), [{ op: "replace", path: "", value: {} }])
  t.eq(diff(null, {}), [{ op: "replace", path: "", value: {} }])
  t.eq(diff(1, {}), [{ op: "replace", path: "", value: {} }])
  t.eq(diff([], {}), [{ op: "replace", path: "", value: {} }])
})

test("strict - throws when an object has a prototype", (t) => {
  const proto = { foo: "bar" }

  const WithPrototype = function () {}
  WithPrototype.prototype = proto

  const a = new WithPrototype()
  const b = { key: "value" }

  t.throws(() => {
    diff(a, b, { strict: true })
  }, /has a prototype/)

  t.throws(() => {
    diff(b, a, { strict: true })
  }, /has a prototype/)

  // not strict
  t.eq(diff(a, b), [{ op: "add", path: "/key", value: "value" }])
  t.eq(diff(b, a), [{ op: "remove", path: "/key" }])
})

test("strict - throws when an object contains a function", (t) => {
  const a = { foo: "bar" }

  const f = () => {}
  const b = { f }

  t.throws(() => {
    diff(a, b, { strict: true })
  }, /valid JSON value/)

  t.eq(diff(a, b), [
    { op: "add", path: "/f", value: f },
    { op: "remove", path: "/foo" },
  ])
})

test("support comparing empty objects", (t) => {
  t.eq(diff({}, {}), [])
})

test("support comparing equal objects", (t) => {
  const a = { foo: { bar: "baz" } }
  const b = { foo: { bar: "baz" } }
  t.eq(diff(a, b), [])
})

test("support comparing equal objects", "hashmap", (t) => {
  const a = t.utils.hashmap({ foo: { bar: "baz" } })
  const b = t.utils.hashmap({ foo: { bar: "baz" } })
  t.eq(diff(a, b), [])
})

test("support single top-level add", (t) => {
  const a = {}
  const b = { foo: "bar" }
  t.eq(diff(a, b), [{ op: "add", path: "/foo", value: "bar" }])
})

test("support single top-level add", "hashmap", (t) => {
  const a = t.utils.hashmap({})
  const b = t.utils.hashmap({ foo: "bar" })
  t.eq(diff(a, b), [{ op: "add", path: "/foo", value: "bar" }])
})

test("support multiple top-level adds", (t) => {
  const a = {}
  const b = { foo: "bar", baz: 5 }
  t.eq(diff(a, b), [
    { op: "add", path: "/foo", value: "bar" },
    { op: "add", path: "/baz", value: 5 },
  ])
})

test("support nested object adds", (t) => {
  const a = { foo: "bar", nested: { baz: {} } }
  const b = { foo: "bar", nested: { baz: { key: "value" } } }
  t.eq(diff(a, b), [{ op: "add", path: "/nested/baz/key", value: "value" }])
})

test("support single a top-level remove", (t) => {
  const a = { foo: "bar" }
  const b = {}
  t.eq(diff(a, b), [{ op: "remove", path: "/foo" }])
})

test("support multiple top-level removes", (t) => {
  const a = { foo: "bar", baz: 5 }
  const b = {}
  t.eq(diff(a, b), [
    { op: "remove", path: "/foo" },
    { op: "remove", path: "/baz" },
  ])
})

test("support nested object removes", (t) => {
  const a = { nested: { inner: { something: 5 } } }
  const b = { nested: { inner: {} } }
  t.eq(diff(a, b), [{ op: "remove", path: "/nested/inner/something" }])
})

test("support a single top-level replace", (t) => {
  const a = { foo: "bar" }
  const b = { foo: "baz" }
  t.eq(diff(a, b), [{ op: "replace", path: "/foo", value: "baz" }])
})

test("support multiple top-level replaces", (t) => {
  const a = { foo: "bar", baz: 5 }
  const b = { foo: "baz", baz: 8 }
  t.eq(diff(a, b), [
    { op: "replace", path: "/foo", value: "baz" },
    { op: "replace", path: "/baz", value: 8 },
  ])
})

test("support nested object replaces", (t) => {
  const a = { nested: { inner: { something: 5 } } }
  const b = { nested: { inner: { something: 8 } } }
  t.eq(diff(a, b), [
    { op: "replace", path: "/nested/inner/something", value: 8 },
  ])
})

test("support nested replaces of null", (t) => {
  const a = { nested: { inner: null } }
  const b = { nested: { inner: { something: 8 } } }
  t.eq(diff(a, b), [
    { op: "replace", path: "/nested/inner", value: { something: 8 } },
  ])
})

test("support nested replaces by null", (t) => {
  const a = { nested: { inner: { something: 5 } } }
  const b = { nested: { inner: null } }
  t.eq(diff(a, b), [{ op: "replace", path: "/nested/inner", value: null }])
})

test("support a single top-level remove in an array leaving it empty", (t) => {
  const a = ["foo"]
  const b = []
  t.eq(diff(a, b), [{ op: "remove", path: "/0" }])
})

test("support a single top-level add to an empty array", (t) => {
  const a = []
  const b = ["foo"]
  t.eq(diff(a, b), [{ op: "add", path: "/0", value: "foo" }])
})

test("support an add at the beginning of an array", (t) => {
  const a = ["foo"]
  const b = ["bar", "foo"]
  t.eq(diff(a, b), [{ op: "add", path: "/0", value: "bar" }])
})

test("support an add at the end of an array", (t) => {
  const a = ["foo"]
  const b = ["foo", "bar"]
  t.eq(diff(a, b), [{ op: "add", path: "/1", value: "bar" }])
})

test("support an add in the middle of an array", (t) => {
  const a = ["foo", "baz"]
  const b = ["foo", "bar", "baz"]
  t.eq(diff(a, b), [{ op: "add", path: "/1", value: "bar" }])
})

test("support a remove at the beginning of an array", (t) => {
  const a = ["bar", "foo"]
  const b = ["foo"]
  t.eq(diff(a, b), [{ op: "remove", path: "/0" }])
})

test("support a remove at the end of an array", (t) => {
  const a = ["foo", "bar"]
  const b = ["foo"]
  t.eq(diff(a, b), [{ op: "remove", path: "/1" }])
})

test("support a remove in the middle of an array", (t) => {
  const a = ["foo", "bar", "baz"]
  const b = ["foo", "baz"]
  t.eq(diff(a, b), [{ op: "remove", path: "/1" }])
})

test("support a replace at the beginning of an array", (t) => {
  const a = ["foo", "bar"]
  const b = ["baz", "bar"]
  t.eq(diff(a, b), [{ op: "replace", path: "/0", value: "baz" }])
})

test("support a replace at the end of an array", (t) => {
  const a = ["foo", "bar"]
  const b = ["foo", "baz"]
  t.eq(diff(a, b), [{ op: "replace", path: "/1", value: "baz" }])
})

test("support a replace in the middle of an array", (t) => {
  const a = ["foo", "bar", "baz"]
  const b = ["foo", "quux", "baz"]
  t.eq(diff(a, b), [{ op: "replace", path: "/1", value: "quux" }])
})

// test("xxx", (t) => {
//   const a = ["foo", ["bar", "baz"]]
//   const b = ["foo", ["bar", "quux"]]
//   t.eq(diff(a, b), [{ op: "replace", path: "/1", value: "quux" }])
// })

test("support an add, remove and replace from different areas of an array", (t) => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
  const b = [1, 3, 4, 5, 11, 7, 8, 9, 44, 0]
  t.eq(diff(a, b), [
    { op: "add", path: "/9", value: 44 },
    { op: "replace", path: "/5", value: 11 },
    { op: "remove", path: "/1" },
  ])
})

test("support comparing an array nested in an object", (t) => {
  const a = { foo: { bar: [1, 2, 3] } }
  const b = { foo: { bar: [2, 3, 4] } }
  t.eq(diff(a, b), [
    { op: "add", path: "/foo/bar/3", value: 4 },
    { op: "remove", path: "/foo/bar/0" },
  ])
})

test("support comparing an array nested within an array", (t) => {
  const a = { foo: { bar: [1, [], 3] } }
  const b = { foo: { bar: [1, [2], 3] } }
  t.eq(diff(a, b), [{ op: "add", path: "/foo/bar/1/0", value: 2 }])
})

test("support comparing an object nested in an array", (t) => {
  const a = [{ foo: { bar: [1, [], 3] } }]
  const b = [{ foo: { bar: [1, [2], 3] }, baz: 3 }]
  t.eq(diff(a, b), [
    { op: "add", path: "/0/foo/bar/1/0", value: 2 },
    { op: "add", path: "/0/baz", value: 3 },
  ])
})

test("support comparing an array to an object", (t) => {
  const a = []
  const b = {}
  t.eq(diff(a, b), [{ op: "replace", path: "", value: {} }])
  t.eq(diff(b, a), [{ op: "replace", path: "", value: [] }])
})

test("support json parsed objects", (t) => {
  const a = JSON.parse('{"foo": "bar"}')
  const b = JSON.parse('{"foo": "baz"}')
  t.eq(diff(a, b), [{ op: "replace", path: "/foo", value: "baz" }])
})

test("support escaping a forward slash in the path", (t) => {
  const a = { "a/b": "val" }
  const b = { "a/b": "new-val" }
  t.eq(diff(a, b), [{ op: "replace", path: "/a~1b", value: "new-val" }])
})

test("support escaping a tilde in the path", (t) => {
  const a = { "a~b": "val" }
  const b = { "a~b": "new-val" }
  t.eq(diff(a, b), [{ op: "replace", path: "/a~0b", value: "new-val" }])
})

test("support -0", (t) => {
  const a = 0
  const b = -0
  t.eq(diff(a, b), [{ op: "replace", path: "", value: -0 }])
})

test("support regex", (t) => {
  const a = /41/
  const b = /42/
  t.eq(diff(a, b), [{ op: "replace", path: "", value: /42/ }])
})

test("support null", (t) => {
  const a = undefined
  const b = null
  t.eq(diff(a, b), [{ op: "replace", path: "", value: null }])
})

test("support undefined", (t) => {
  const a = null
  const b = undefined
  t.eq(diff(a, b), [{ op: "replace", path: "", value: undefined }])
})

test("circular Object", (t) => {
  const a = { x: 1 }
  a.circular = a
  const b = { x: 1 }
  b.circular = b
  t.eq(diff(a, b), [])
})

test("circular Object", 2, (t) => {
  const a = { x: 1 }
  a.circular = a
  const b = { x: 2 }
  b.circular = b
  t.eq(diff(a, b), [{ op: "replace", path: "/x", value: 2 }])
})

test("circular Object", 3, (t) => {
  const a = { x: 1 }
  a.circular = a
  const b = { x: 1 }
  b.circular = 1
  t.eq(diff(a, b), [{ op: "replace", path: "/circular", value: 1 }])
})

test("circular Object", 4, (t) => {
  const a = { x: 1 }
  a.circular = 1
  const b = { x: 1 }
  b.circular = b

  const y = { x: 1 }
  y.circular = y

  t.eq(diff(a, b), [{ op: "replace", path: "/circular", value: y }])
})

test("circular Object", 5, (t) => {
  const a = { x: { y: 1 } }
  a.circular = a
  const b = { x: { y: 1 } }
  b.circular = b.x
  t.eq(diff(a, b), [{ op: "replace", path: "/circular", value: { y: 1 } }])
})

test("circular primitives not skipped", (t) => {
  const a = [2, 2]
  const b = [3, 3]

  const patches = diff(a, b)
  const patched = patch(a, patches)
  t.eq(patched, b, { patch: patches })
})

test("Map", (t) => {
  const a = { x: new Map([["y", { z: 1 }]]) }
  const b = { x: new Map([["y", { z: 2 }]]) }
  t.eq(diff(a, b), [{ op: "replace", path: "/x/y/z", value: 2 }])
})

test("Set", (t) => {
  const a = { x: new Set(["y", { z: 1 }]) }
  const b = { x: new Set(["y", { z: 2 }]) }
  t.eq(diff(a, b), [{ op: "replace", path: "/x/1/z", value: 2 }])
})

test("RegExp", (t) => {
  let a
  let b

  a = { x: /42/, y: 1 }
  b = { x: /42/, y: 2 }
  t.eq(diff(a, b), [{ op: "replace", path: "/y", value: 2 }])

  a = { x: /42/, y: 1 }
  b = { x: /43/, y: 1 }
  t.eq(diff(a, b), [{ op: "replace", path: "/x", value: /43/ }])

  a = { x: /42/, y: 1 }
  b = { x: /43/, y: 2 }
  t.eq(diff(a, b), [
    { op: "replace", path: "/x", value: /43/ },
    { op: "replace", path: "/y", value: 2 },
  ])
})

// test("string", (t) => {
//   const a = "abc"
//   const b = "ab"
//   t.eq(diff(a, b), [])
// })

/* generated */

// test("generated", async (t) => {
//   await t.hold(
//     {
//       // trials: 1000,
//       ensure: [
//         [0x09_04_28_d3_3e_de, 721], //
//       ],
//     },
//     [t.gen.json(), t.gen.json()],
//     (a, b) => {
//       const patch = diff(a, b)
//       const patched = patchable(a, { strict: true }).patch(patch)
//       t.eq(patched, b, { patch })
//     }
//   )
// })
