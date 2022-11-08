import test from "../../../../../42/test.js"
import resolve from "../../../../../42/fabric/json/resolve.js"

test("ignore non resolvable", async (t) => {
  t.is(await resolve(1), 1)
  t.is(await resolve("a"), "a")

  const reg = /a/i
  t.eq(await resolve(reg), reg)

  const date = new Date()
  t.eq(await resolve(date), date)
})

test("simple", async (t) => {
  const res = await resolve(
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

test("simple", 2, async (t) => {
  const res = await resolve(
    t.stays({
      foo: 1,
      baz: { x: { $ref: "#/bar" }, y: "z" },
      bar: { $ref: "#/foo" },
    })
  )
  t.eq(res, {
    foo: 1,
    bar: 1,
    baz: { x: 1, y: "z" },
  })
})

test("undefined ref", async (t) => {
  const res = await resolve(
    t.stays({
      foo: { $ref: "#/nope" },
    })
  )
  t.eq(res, {
    foo: undefined,
  })
})

test("undefined ref with data", async (t) => {
  const res = await resolve(
    t.stays({
      foo: { a: 1, $ref: "#/nope", b: 2 },
    })
  )
  t.eq(res, {
    foo: { a: 1, b: 2 },
  })
})

test("object", async (t) => {
  const res = await resolve(
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

test("circular object", async (t) => {
  const res = await resolve(
    t.stays({
      foo: { a: 1, b: null },
      bar: { $ref: "#" },
    })
  )
  t.is(res.bar, res)
})

test("$ref without props", async (t) => {
  const res = await resolve(
    t.stays({
      foo: { a: 1 },
      bar: { $ref: "#/foo" },
    })
  )
  t.eq(res.foo, { a: 1 })
  t.eq(res.bar, res.foo)
  t.is(res.bar, res.foo)
})

test("$ref with props before $ref keyword", async (t) => {
  const res = await resolve(
    t.stays({
      foo: { a: 1 },
      bar: { b: 2, $ref: "#/foo" },
    })
  )
  t.eq(res, {
    foo: { a: 1 },
    bar: { b: 2, a: 1 },
  })
})

test("$ref with props after $ref keyword", async (t) => {
  const res = await resolve(
    t.stays({
      foo: { a: 1 },
      bar: { $ref: "#/foo", b: 2 },
    })
  )
  t.eq(res, {
    foo: { a: 1 },
    bar: { b: 2, a: 1 },
  })
})

test("data before and after $ref", async (t) => {
  const res = await resolve({
    a: 1,
    $ref: "#/$defs/foo",
    b: 2,
    $defs: { foo: { c: 3 } },
  })

  t.eq(res, { a: 1, b: 2, c: 3, $defs: { foo: { c: 3 } } })
})

test("data before and after $ref", "cache", async (t) => {
  const res = await resolve(
    {
      a: 1,
      $ref: "http://localhost:1234/",
      b: 2,
    },
    {
      cache: {
        "http://localhost:1234/": { c: 3 },
      },
    }
  )

  t.eq(res, { a: 1, b: 2, c: 3 })
})

test("data before and after $ref", "array", async (t) => {
  const res = await resolve({
    a: { 0: "X", $ref: "#/$defs/arr", 1: "Y", 2: "Z" },
    $defs: {
      arr: ["x", "y"],
    },
  })
  t.eq(res.a, ["x", "y", "Z"])
})

test("$ref in array", async (t) => {
  const x = [1]
  const res = await resolve({ a: [x, { $ref: "#" }, { $ref: "#/a/0" }] })

  t.eq(res.a[0], x)
  t.eq(res.a[2], x)
  t.is(res.a[2], res.a[0])
  t.is(res.a[1], res)
})

test("$ref in array", "root", async (t) => {
  const x = [1]
  const res = await resolve([x, { $ref: "#" }, { $ref: "#/0" }])
  t.eq(res[0], x)
  t.eq(res[2], x)
  t.is(res[2], res[0])
  t.is(res[1], res)
})

test("$ref in array", 2, async (t) => {
  const res = await resolve({
    foo: { a: 1, b: null },
    bar: [{ $ref: "#/foo" }],
  })
  t.is(res.bar[0], res.foo)
})

test("circular $ref in array", async (t) => {
  const res = await resolve({
    foo: { a: 1, b: null },
    bar: [{ $ref: "#/foo" }, { $ref: "#" }],
  })
  t.is(res.bar[0], res.foo)
  t.is(res.bar[1], res)
})

test("remote $ref", async (t) => {
  const cache = {
    "http://example.com/data.json": { a: 1 },
  }
  const res = await resolve(
    { bar: { $ref: "http://example.com/data.json" } },
    { cache }
  )
  t.eq(res, { bar: { a: 1 } })
})

test("remote $ref", 2, async (t) => {
  const cache = {
    "http://example.com/data.json": { a: 1 },
  }
  const res = await resolve(
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

test("remote $ref", 3, async (t) => {
  const cache = t.stays({
    "http://example.com/data.json": { baz: { a: 1, b: null } },
  })
  const res = await resolve(
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

test("$ref in $ref", async (t) => {
  const res = await resolve(
    { $ref: "http://localhost:1234/tree" },
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

test("circular dependencies", async (t) => {
  const res = await resolve(
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

test("circular dependencies using $id", async (t) => {
  const res = await resolve({
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

test("circular dependencies using $id", 2, async (t) => {
  const res = await resolve({
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

test("nested $ref", async (t) => {
  const res = await resolve({
    $defs: {
      a: { type: "integer" },
      b: { $ref: "#/$defs/a" },
      c: { $ref: "#/$defs/b" },
    },
    x: {
      $ref: "#/$defs/c",
    },
  })
  // t.is(res, {})
  t.is(res.$defs.b, res.$defs.a)
  t.is(res.$defs.c, res.$defs.b)
  t.is(res.x, res.$defs.a)
  t.eq(res.x, { type: "integer" })
})

test("nested $ref", "$defs at the end", async (t) => {
  const res = await resolve({
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

test("$ref at root", async (t) => {
  const res = await resolve({
    $ref: "#/$defs/a",
    $defs: {
      a: { type: "integer" },
    },
  })

  t.is(res.type, "integer")
})

test("$ref at root", "nested $ref", async (t) => {
  const res = await resolve({
    $defs: {
      a: { type: "integer" },
      b: { $ref: "#/$defs/a" },
      c: { $ref: "#/$defs/b" },
    },
    $ref: "#/$defs/c",
  })

  t.is(res.type, "integer")
})

test("$ref at root", "nested $ref", "$defs at the end", async (t) => {
  const res = await resolve({
    $ref: "#/$defs/c",
    $defs: {
      a: { type: "integer" },
      b: { $ref: "#/$defs/a" },
      c: { $ref: "#/$defs/b" },
    },
  })

  t.is(res.type, "integer")
})

test("duplicate $ref", async (t) => {
  const res = await resolve({
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

  // t.eq(res)
  t.is(res.properties.allOf, res.properties.anyOf)
  t.is(res.$defs.schemaArray, res.properties.anyOf)
})

test("duplicate $ref", "data after $ref", async (t) => {
  const res = await resolve({
    properties: {
      allOf: { $ref: "#/$defs/schemaArray", length: 3 },
      anyOf: { $ref: "#/$defs/schemaArray", length: 4 },
    },
    $defs: {
      schemaArray: {
        type: "array",
      },
    },
  })

  t.eq(res, {
    properties: {
      allOf: {
        type: "array",
        length: 3,
      },
      anyOf: {
        type: "array",
        length: 4,
      },
    },
    $defs: {
      schemaArray: {
        type: "array",
      },
    },
  })
})

/* from JSON-Schema-Test-Suite */

test("location-independent identifier", async (t) => {
  const res = await resolve({
    definitions: { A: { $id: "#foo", type: "integer" } },
    allOf: [{ $ref: "#foo" }],
  })
  t.is(res.allOf[0], res.definitions.A)
  t.eq(res, {
    definitions: { A: { $id: "#foo", type: "integer" } },
    allOf: [{ $id: "#foo", type: "integer" }],
  })
})

test("Location-independent identifier with absolute URI", async (t) => {
  const res = await resolve({
    $ref: "http://localhost:1234/draft-next/bar#foo",
    $defs: {
      A: {
        $id: "http://localhost:1234/draft-next/bar",
        $anchor: "foo",
        type: "integer",
      },
    },
  })
  t.eq(res.type, "integer")
})

test("Location-independent identifier with base URI change in subschema", async (t) => {
  const res = await resolve({
    $id: "http://localhost:1234/draft-next/root",
    $ref: "http://localhost:1234/draft-next/nested.json#foo",
    $defs: {
      A: {
        $id: "nested.json",
        $defs: {
          B: {
            $anchor: "foo",
            type: "integer",
          },
        },
      },
    },
  })
  t.eq(res.type, "integer")
})

test("same $anchor with different base uri", async (t) => {
  const res = await resolve({
    $id: "http://localhost:1234/draft-next/foobar",
    $defs: {
      A: {
        $id: "child1",
        allOf: [
          {
            $anchor: "my_anchor",
            type: "string",
          },
          {
            $id: "child2",
            $anchor: "my_anchor",
            type: "number",
          },
        ],
      },
    },
    $ref: "child1#my_anchor",
  })
  t.is(res.type, "string")
})

test("non-schema object containing an $anchor property", async (t) => {
  const res = await resolve({
    foo: { $ref: "#not_a_real_anchor" },
    $defs: {
      notAnchor: {
        const: {
          $anchor: "not_a_real_anchor",
        },
      },
    },
  })
  t.eq(res, {
    foo: undefined,
    $defs: { notAnchor: { const: { $anchor: "not_a_real_anchor" } } },
  })
})

/* dynamicRef */

test("A $dynamicRef to a $dynamicAnchor in the same schema resource behaves like a normal $ref to an $anchor", async (t) => {
  const res = await resolve({
    type: "array",
    items: { $ref: "#items" },
    $defs: {
      foo: {
        $anchor: "items",
        type: "string",
      },
    },
  })

  t.is(res.items, res.$defs.foo)

  const res2 = await resolve({
    type: "array",
    items: { $dynamicRef: "#items" },
    $defs: {
      foo: {
        $dynamicAnchor: "items",
        type: "string",
      },
    },
  })

  t.is(res2.items, res2.$defs.foo)
})

test("A $dynamicRef resolves to the first $dynamicAnchor still in scope that is encountered when the schema is evaluated", async (t) => {
  const res = await resolve({
    $ref: "list",
    $defs: {
      foo: {
        $dynamicAnchor: "items",
        type: "string",
      },
      list: {
        $id: "list",
        type: "array",
        items: { $dynamicRef: "#items" },
      },
    },
  })

  t.eq(res.type, "array")
  t.eq(res.items.type, "string")
})

test(
  "A $dynamicRef resolves to the first $dynamicAnchor still in scope that is encountered when the schema is evaluated",
  "fail when using $ref",
  async (t) => {
    await t.throws(() =>
      resolve({
        $ref: "list",
        $defs: {
          foo: {
            $dynamicAnchor: "items",
            type: "string",
          },
          list: {
            $id: "list",
            type: "array",
            items: { $ref: "#items" },
          },
        },
      })
    )
  }
)

test(
  "A $dynamicRef resolves to the first $dynamicAnchor still in scope that is encountered when the schema is evaluated",
  "fail when using $anchor",
  async (t) => {
    await t.throws(() =>
      resolve({
        $ref: "list",
        $defs: {
          foo: {
            $anchor: "items",
            type: "string",
          },
          list: {
            $id: "list",
            type: "array",
            items: { $dynamicRef: "#items" },
          },
        },
      })
    )
  }
)

/* fetch
======== */

test("fetch", "json", async (t) => {
  t.timeout(500)
  const res = await resolve({
    $ref: new URL("../../../../fixtures/json/integer.json", import.meta.url),
  })
  t.eq(res, { type: "integer" })
})

test.skip("fetch", "json", "not found", async (t) => {
  t.timeout(500)
  await t.throws(
    () =>
      resolve({
        $ref: "notfound",
      }),
    /Not Found/
  )
})

test("fetch", "javascript", "strict", async (t) => {
  t.timeout(500)
  await t.throws(
    () =>
      resolve({
        $ref: new URL("../../../../fixtures/json/integer.js", import.meta.url),
      }),
    /not allowed in strict mode/
  )
})

test("fetch", "javascript", async (t) => {
  t.timeout(500)
  const res = await resolve(
    { $ref: new URL("../../../../fixtures/json/integer.js", import.meta.url) },
    { strict: false }
  )
  t.eq(res, { type: "integer" })
})

test("fetch", "circular dependencies", async (t) => {
  t.timeout(500)
  const res = await resolve({
    $ref: new URL("../../../../fixtures/json/tree", import.meta.url),
  })

  t.is(res.properties.nodes.items.description, "node")
  t.is(res.properties.nodes.items.properties.subtree, res)
})
