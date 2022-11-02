import test from "../../../../../42/test.js"
import resolve from "../../../../../42/fabric/json/resolve.js"

test("ignore non resolvable", (t) => {
  t.is(resolve.sync(1), 1)
  t.is(resolve.sync("a"), "a")

  const reg = /a/i
  t.eq(resolve.sync(reg), reg)

  const date = new Date()
  t.eq(resolve.sync(date), date)
})

test("simple", (t) => {
  const res = resolve.sync(
    t.stays({
      foo: 1,
      bar: { $ref: "#/foo" },
      baz: { x: { $ref: "#/bar" }, y: "z" },
    })
  )
  t.eq(res, {
    foo: 1,
    bar: 1,
    baz: { x: 1, y: "z" },
  })
})

test("object", (t) => {
  const res = resolve.sync(
    t.stays({
      foo: { a: 1, b: null },
      bar: { $ref: "#/foo" },
    })
  )
  t.is(res.bar, res.foo)
  t.is(res.bar.a, 1)
  t.is(res.bar.b, null)
  res.foo.a = 2
  t.is(res.bar.a, 2)
})

test("circular object", (t) => {
  const res = resolve.sync(
    t.stays({
      foo: { a: 1, b: null },
      bar: { $ref: "#" },
    })
  )
  t.is(res.bar, res)
})

test.only("$ref with props", (t) => {
  const res = resolve.sync(
    t.stays({
      foo: { a: 1 },
      bar: { $ref: "#/foo", b: 2 },
    })
  )
  t.eq(res.foo, { a: 1 })
  t.eq(res.bar, res.foo)
  t.is(res.bar, res.foo)
})

test.only("$ref with props", "strict:false", (t) => {
  const res = resolve.sync(
    t.stays({
      foo: { a: 1 },
      bar: { $ref: "#/foo", b: 2 },
    }),
    { strict: false }
  )
  t.eq(res.foo, { a: 1, b: 2 })
  t.eq(res.bar, res.foo)
})

test.only("data after $ref", (t) => {
  const res = resolve.sync(
    {
      a: 1,
      $ref: "http://localhost:1234/",
      b: 2,
    },
    {
      strict: false,
      cache: {
        "http://localhost:1234/": { c: 3 },
      },
    }
  )

  t.eq(res, { a: 1, b: 2, c: 3 })
})

test("$ref in array", (t) => {
  const x = [1]
  const res = resolve.sync([x, { $ref: "#" }, { $ref: "#/0" }])
  t.eq(res[0], x)
  t.eq(res[2], x)
  t.is(res[2], res[0])
  t.is(res[1], res)
})

test("$ref in array", 2, (t) => {
  const res = resolve.sync({
    foo: { a: 1, b: null },
    bar: [{ $ref: "#/foo" }],
  })
  t.is(res.bar[0], res.foo)
})

test("circular $ref in array", (t) => {
  const res = resolve.sync({
    foo: { a: 1, b: null },
    bar: [{ $ref: "#/foo" }, { $ref: "#" }],
  })
  t.is(res.bar[0], res.foo)
  t.is(res.bar[1], res)
})

test("remote $ref", (t) => {
  const cache = {
    "http://example.com/data.json": { a: 1 },
  }
  const res = resolve.sync(
    { bar: { $ref: "http://example.com/data.json" } },
    { cache }
  )
  t.eq(res, { bar: { a: 1 } })
})

test("remote $ref", 2, (t) => {
  const cache = {
    "http://example.com/data.json": { a: 1 },
  }
  const res = resolve.sync(
    {
      bar: { $ref: "http://example.com/data.json" },
      foo: { $ref: "http://example.com/data.json" },
    },
    { cache }
  )

  t.eq(res.bar, { a: 1 }, "res.bar")
  t.eq(res.foo, { a: 1 }, "res.foo")
  // common refs share a single object
  t.is(res.foo, res.bar)
})

test("remote $ref", 3, (t) => {
  const cache = t.stays({
    "http://example.com/data.json": { baz: { a: 1, b: null } },
  })
  const res = resolve.sync(
    t.stays({
      bar: { $ref: "http://example.com/data.json#/baz" },
      foo: { $ref: "http://example.com/data.json#/baz" },
    }),
    { cache }
  )

  t.is(res.bar.a, 1)
  t.is(res.bar.b, null)
  t.is(res.foo.a, 1)
  t.is(res.foo.b, null)

  res.bar.a = 2
  t.is(res.foo.a, 2)
})

test("$ref in $ref", (t) => {
  const res = resolve.sync(
    {
      $ref: "http://localhost:1234/tree",
    },
    {
      cache: {
        "http://localhost:1234/tree": {
          foo: { $ref: "node" },
        },
        "http://localhost:1234/node": {
          type: "object",
        },
      },
    }
  )
  t.eq(res, {
    foo: { type: "object" },
  })
})

test("circular dependencies", (t) => {
  const res = resolve.sync(
    { $ref: "http://localhost:1234/tree" },
    {
      cache: {
        "http://localhost:1234/tree": {
          description: "tree of nodes",
          type: "object",
          properties: {
            meta: { type: "string" },
            nodes: { type: "array", items: { $ref: "node" } },
          },
          required: ["meta", "nodes"],
        },
        "http://localhost:1234/node": {
          description: "node",
          type: "object",
          properties: { value: { type: "number" }, subtree: { $ref: "tree" } },
          required: ["value"],
        },
      },
    }
  )

  t.is(res.properties.nodes.items.description, "node")
  t.is(res.properties.nodes.items.properties.subtree, res)
})

test("circular dependencies using $id", (t) => {
  const res = resolve.sync({
    $id: "http://localhost:1234/tree",
    $defs: {
      node: {
        $id: "http://localhost:1234/node",
        properties: { subtree: { $ref: "tree" } },
      },
    },
    properties: {
      nodes: { items: { $ref: "node" } },
    },
  })

  t.is(res.properties.nodes.items.properties.subtree, res)
  t.is(res.properties.nodes.items, res.$defs.node)
})

test("circular dependencies using $id", 2, (t) => {
  const res = resolve.sync({
    $id: "http://localhost:1234/tree",
    properties: {
      nodes: { items: { $ref: "node" } },
    },
    $defs: {
      node: {
        $id: "http://localhost:1234/node",
        properties: { subtree: { $ref: "tree" } },
      },
    },
  })

  t.is(res.properties.nodes.items.properties.subtree, res)
  t.is(res.properties.nodes.items, res.$defs.node)
})

test("nested $ref", (t) => {
  const res = resolve.sync({
    $defs: {
      a: { type: "integer" },
      b: { $ref: "#/$defs/a" },
      c: { $ref: "#/$defs/b" },
    },
    x: {
      $ref: "#/$defs/c",
    },
  })
  t.is(res.$defs.b, res.$defs.a)
  t.is(res.$defs.c, res.$defs.b)
  t.is(res.x, res.$defs.a)
  t.eq(res.x, { type: "integer" })
})

test("nested $ref", "$defs at the end", (t) => {
  const res = resolve.sync({
    x: {
      $ref: "#/$defs/c",
    },
    $defs: {
      a: { type: "integer" },
      b: { $ref: "#/$defs/a" },
      c: { $ref: "#/$defs/b" },
    },
  })
  t.is(res.$defs.b, res.$defs.a)
  t.is(res.$defs.c, res.$defs.b)
  t.is(res.x, res.$defs.a)
  t.eq(res.x, { type: "integer" })
})

test("$ref at root", (t) => {
  const res = resolve.sync({
    $ref: "#/$defs/a",
    $defs: {
      a: { type: "integer" },
    },
  })

  t.eq(res, { type: "integer" })
})

test("nested $ref", "$ref at root", (t) => {
  const res = resolve.sync({
    $ref: "#/$defs/c",
    $defs: {
      a: { type: "integer" },
      b: { $ref: "#/$defs/a" },
      c: { $ref: "#/$defs/b" },
    },
  })

  t.eq(res, { type: "integer" })
})

test("nested $ref and $ref at root", "$defs at the end", (t) => {
  const res = resolve.sync({
    $ref: "#/$defs/c",
    $defs: {
      a: { type: "integer" },
      b: { $ref: "#/$defs/a" },
      c: { $ref: "#/$defs/b" },
    },
  })

  t.eq(res, { type: "integer" })
})

test.skip("duplicate $ref", (t) => {
  const res = resolve.sync({
    properties: {
      allOf: { $ref: "#/$defs/schemaArray" },
      anyOf: { $ref: "#/$defs/schemaArray" },
    },
    $defs: {
      schemaArray: {
        type: "array",
      },
    },
  })

  t.eq(res)
  // t.is(res.properties.allOf, res.properties.anyOf)
  t.is(res.$defs.schemaArray, res.properties.anyOf)
})

/* from draft-07-test-suite.js */

test.skip("location-independent identifier", (t) => {
  const res = resolve.sync({
    definitions: { A: { $id: "#foo", type: "integer" } },
    allOf: [{ $ref: "#foo" }],
  })
  t.eq(res, {
    definitions: { A: { $id: "#foo", type: "integer" } },
    allOf: [{ $id: "#foo", type: "integer" }],
  })
})
