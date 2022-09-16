import test from "../../../../../42/test.js"
import patch from "../../../../../42/fabric/json/patch.js"

import JSONPatchSuite from "../../../../annexes/JSONPatchSuite.js"

const { clone } = test.utils

test.tasks(
  JSONPatchSuite,
  ({ doc, patch: patches, expected, error, comment }, i) => {
    doc = clone(doc)

    test(comment ?? patches, (t) => {
      const message = `${i}.\n
patch(${t.utils.stringify(doc)}, ${t.utils.stringify(patches)})\n`

      if (error) {
        t.throws(
          () => patch(doc, patches, { strict: true }),
          false,
          message + `\nshould throw: "${error}"`
        )
      } else {
        t.eq(
          patch(doc, patches, { strict: true }),
          expected,
          message + `\nexpected: ${t.utils.stringify(expected)}`
        )
      }
    })
  }
)

test("use `-` keyword only on array-likes", (t) => {
  const [a, b] = [
    { "-": 0 }, //
    {},
  ]

  let patched = patch(
    a,
    {
      op: "remove",
      path: "/-",
    },
    { strict: true }
  )
  t.eq(patched, b)

  const arr = [1, 2]
  patched = patch(
    arr,
    {
      op: "remove",
      path: "/-",
    },
    { strict: true }
  )
  t.eq(patched, [1])

  const str = "ab"
  patched = patch(
    str,
    {
      op: "remove",
      path: "/-",
    },
    { strict: true }
  )
  t.eq(patched, "a")
})

test("string - add", (t) => {
  const a = "hello"
  const b = "hello world"

  const patched = patch(
    a,
    {
      op: "add",
      path: "/5",
      value: " world",
    },
    { strict: true }
  )
  t.eq(patched, b)

  t.eq(
    patched,
    patch(
      a,
      {
        op: "add",
        path: "/-",
        value: " world",
      },
      { strict: true }
    )
  )
})

test("string - insert", (t) => {
  const a = "hello world"
  const b = "hello derp world"

  const patched = patch(
    a,
    {
      op: "add",
      path: "/5",
      value: " derp",
    },
    { strict: true }
  )
  t.eq(patched, b)
})

test("string - replace", (t) => {
  const a = "hello world"
  const b = "hello derpd"

  const patched = patch(
    a,
    {
      op: "replace",
      path: "/5",
      value: " derp",
    },
    { strict: true }
  )
  t.eq(patched, b)
})

test("string - replace", (t) => {
  const a = "hello world"
  const b = "hello"

  const patched = patch(
    a,
    {
      op: "remove",
      path: "/5",
      value: " world",
    },
    { strict: true }
  )
  t.eq(patched, b)

  t.eq(
    patched,
    patch(
      a,
      {
        op: "remove",
        path: "/5",
        value: 6,
      },
      { strict: true }
    )
  )
})

test("string - replace", (t) => {
  const a = "hello world"
  const b = "hello"

  const patched = patch(
    a,
    {
      op: "remove",
      path: "/5",
      value: " world",
    },
    { strict: true }
  )
  t.eq(patched, b)

  t.eq(
    patched,
    patch(
      a,
      {
        op: "remove",
        path: "/5",
        value: 6,
      },
      { strict: true }
    )
  )
})

test("string - replace", 2, (t) => {
  const a = "abc"

  const patched = patch(
    a,
    {
      op: "remove",
      path: "/1",
    },
    { strict: true }
  )
  t.eq(patched, "ac")
})

test("string in object", (t) => {
  const a = { x: "hello" }
  const b = { x: "hello world" }

  const patched = patch(
    a,
    {
      op: "add",
      path: "/x/5",
      value: " world",
    },
    { strict: true }
  )
  t.eq(patched, b)
})
