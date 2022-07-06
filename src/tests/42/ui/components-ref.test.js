import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/class/Component.js"

const tmp = test.utils.container({ id: "component-ref-tests" })

Component.define({
  tag: "ui-a",
  props: {
    bar: "-",
  },
  content: "foo: {{foo}}, bar: {{bar}}",
})

test("props", 1, async (t) => {
  const app = await ui(tmp(), {
    content: { tag: "ui-a" },
    state: { foo: 1 },
  })

  t.eq(app.reactive.data, {
    "foo": 1,
    "ui-a": { 0: { bar: "-" } },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/foo", //
    "/ui-a/0/bar",
  ])

  t.is(app.el.innerHTML, '<ui-a bar="-">foo: 1, bar: -</ui-a>')

  app.query("ui-a").bar = 0
  await app

  t.is(app.el.innerHTML, '<ui-a bar="0">foo: 1, bar: 0</ui-a>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-a bar="0">foo: 2, bar: 0</ui-a>')
})

test("props", 2, async (t) => {
  const app = await ui(tmp(), {
    content: { tag: "ui-a", bar: 0 },
    state: { foo: 1 },
  })

  t.eq(app.reactive.data, {
    "foo": 1,
    "ui-a": { 0: { bar: 0 } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="0">foo: 1, bar: 0</ui-a>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-a bar="0">foo: 2, bar: 0</ui-a>')
})

test("props", 3, async (t) => {
  const app = await ui(tmp(), {
    content: [
      { tag: "ui-a#a1", bar: -1 }, //
      "\n",
      { tag: "ui-a#a2", bar: -2 },
    ],
    state: { foo: 1 },
  })

  t.eq(app.reactive.data, {
    "foo": 1,
    "ui-a": {
      0: { bar: -1 },
      1: { bar: -2 },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a id="a1" bar="-1">foo: 1, bar: -1</ui-a>
<ui-a id="a2" bar="-2">foo: 1, bar: -2</ui-a>`
  )

  app.query("#a1").bar = -3
  await app

  t.is(
    app.el.innerHTML,
    `\
<ui-a id="a1" bar="-3">foo: 1, bar: -3</ui-a>
<ui-a id="a2" bar="-2">foo: 1, bar: -2</ui-a>`
  )

  app.state.foo = 2
  await app

  t.is(
    app.el.innerHTML,
    `\
<ui-a id="a1" bar="-3">foo: 2, bar: -3</ui-a>
<ui-a id="a2" bar="-2">foo: 2, bar: -2</ui-a>`
  )
})

test("props", 4, async (t) => {
  const app = await ui(tmp(), {
    content: { tag: "ui-a", bar: "{{foo}}" },
    state: { foo: "a" },
  })

  t.eq(app.reactive.data, {
    "foo": "a",
    "ui-a": { 0: { bar: { $ref: "/foo" } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="a">foo: a, bar: a</ui-a>')

  app.state.foo = "b"
  await app

  t.is(app.el.innerHTML, '<ui-a bar="b">foo: b, bar: b</ui-a>')

  app.query("ui-a").bar = "c"
  await app

  t.eq(app.reactive.data, {
    "foo": "c",
    "ui-a": { 0: { bar: { $ref: "/foo" } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="c">foo: c, bar: c</ui-a>')

  app.state.foo = "d"
  await app

  t.eq(app.reactive.data, {
    "foo": "d",
    "ui-a": { 0: { bar: { $ref: "/foo" } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="d">foo: d, bar: d</ui-a>')
})

test("props", 5, async (t) => {
  t.timeout(1000)

  const app = await ui(tmp(), {
    content: { tag: "ui-a", bar: "{{foo |> upper}}" },
    state: { foo: "a" },
  })

  t.eq(app.reactive.data, {
    "foo": "a",
    "ui-a": { 0: { bar: "A" } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="A">foo: a, bar: A</ui-a>')

  app.state.foo = "b"
  await app

  t.is(app.el.innerHTML, '<ui-a bar="B">foo: b, bar: B</ui-a>')

  app.query("ui-a").bar = "c"
  await app

  t.eq(app.reactive.data, {
    "foo": "b",
    "ui-a": { 0: { bar: "c" } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="c">foo: b, bar: c</ui-a>')

  app.state.foo = "d"
  await app

  t.eq(app.reactive.data, {
    "foo": "d",
    "ui-a": { 0: { bar: "D" } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="D">foo: d, bar: D</ui-a>')
})

Component.define({
  tag: "ui-b",
  props: {
    bar: {
      default: 2,
      state: true,
      reflect: true,
    },
  },
  content: "foo: {{foo}}, bar: {{bar}}",
})

test("props state", 1, async (t) => {
  const app = await ui(tmp(), {
    content: { tag: "ui-b" },
    state: { foo: 1 },
  })

  t.eq(app.reactive.data, {
    "foo": 1,
    "ui-b": { 0: {} },
    "bar": 2,
  })

  t.is(app.el.innerHTML, '<ui-b bar="2">foo: 1, bar: 2</ui-b>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-b bar="2">foo: 2, bar: 2</ui-b>')

  app.state.bar = 3
  await app

  t.eq(app.reactive.data, {
    "foo": 2,
    "ui-b": { 0: {} },
    "bar": 3,
  })

  t.is(app.el.innerHTML, '<ui-b bar="3">foo: 2, bar: 3</ui-b>')
})

test("props state", 2, async (t) => {
  const app = await ui(tmp(), {
    content: { tag: "ui-b", bar: 0 },
    state: { foo: 1 },
  })

  t.eq(app.reactive.data, {
    "foo": 1,
    "ui-b": { 0: {} },
    "bar": 0,
  })

  t.is(app.el.innerHTML, '<ui-b bar="0">foo: 1, bar: 0</ui-b>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-b bar="0">foo: 2, bar: 0</ui-b>')

  app.state.bar = 3
  await app

  t.eq(app.reactive.data, {
    "foo": 2,
    "ui-b": { 0: {} },
    "bar": 3,
  })

  t.is(app.el.innerHTML, '<ui-b bar="3">foo: 2, bar: 3</ui-b>')
})

test("scopped", 1, async (t) => {
  const app = await ui(tmp(), {
    content: [
      { scope: "one", content: { tag: "ui-a", bar: 0 } }, //
      "\n",
      { scope: "two", content: { tag: "ui-a", bar: 1 } },
    ],
    state: { foo: 1 },
  })

  t.eq(app.reactive.data, {
    "foo": 1,
    "ui-a": {
      0: { bar: 0 },
      1: { bar: 1 },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a bar="0">foo: , bar: 0</ui-a>
<ui-a bar="1">foo: , bar: 1</ui-a>`
  )
})

test("scopped", 2, async (t) => {
  const app = await ui(tmp(), {
    content: [
      { tag: "ui-a", bar: -1 }, //
      "\n",
      { scope: "one", content: { tag: "ui-a", bar: 0 } }, //
      "\n",
      { scope: "one", content: { tag: "ui-a", bar: "{{foo}}" } }, //
      "\n",
      { scope: "one", content: { tag: "ui-a", bar: "{{../foo}}" } }, //
      "\n",
      { scope: "one", content: { tag: "ui-a", bar: "{{/foo}}" } }, //
      "\n",
      { scope: "two", content: { tag: "ui-a", bar: 3 } },
    ],
    state: { foo: 1, one: { foo: 2 } },
  })

  t.eq(app.reactive.data, {
    "foo": 1,
    "one": { foo: 2 },
    "ui-a": {
      0: { bar: -1 },
      1: { bar: 0 },
      2: { bar: { $ref: "/one/foo" } },
      3: { bar: { $ref: "/foo" } },
      4: { bar: { $ref: "/foo" } },
      5: { bar: 3 },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a bar="-1">foo: 1, bar: -1</ui-a>
<ui-a bar="0">foo: 2, bar: 0</ui-a>
<ui-a bar="2">foo: 2, bar: 2</ui-a>
<ui-a bar="1">foo: 2, bar: 1</ui-a>
<ui-a bar="1">foo: 2, bar: 1</ui-a>
<ui-a bar="3">foo: , bar: 3</ui-a>`
  )

  app.query("ui-a:last-of-type").destroy()

  t.eq(app.reactive.data, {
    "foo": 1,
    "one": { foo: 2 },
    "ui-a": {
      0: { bar: -1 },
      1: { bar: 0 },
      2: { bar: { $ref: "/one/foo" } },
      3: { bar: { $ref: "/foo" } },
      4: { bar: { $ref: "/foo" } },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a bar="-1">foo: 1, bar: -1</ui-a>
<ui-a bar="0">foo: 2, bar: 0</ui-a>
<ui-a bar="2">foo: 2, bar: 2</ui-a>
<ui-a bar="1">foo: 2, bar: 1</ui-a>
<ui-a bar="1">foo: 2, bar: 1</ui-a>\n`
  )
})

test("array", 1, async (t) => {
  const app = await ui(tmp(true), {
    content: {
      scope: "arr",
      each: [
        "\n",
        {
          tag: "ui-a",
          bar: "{{.}}",
        },
      ],
    },
    state: { arr: ["a", "b"], foo: 1 },
  })

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="a">foo: , bar: a</ui-a><!--[#]-->
<ui-a bar="b">foo: , bar: b</ui-a><!--[#]-->`
  )

  t.eq(app.reactive.data, {
    "arr": ["a", "b"],
    "foo": 1,
    "ui-a": {
      0: { bar: { $ref: "/arr/0" } },
      1: { bar: { $ref: "/arr/1" } },
    },
  })

  app.state.arr.push("c")
  await app

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="a">foo: , bar: a</ui-a><!--[#]-->
<ui-a bar="b">foo: , bar: b</ui-a><!--[#]-->
<ui-a bar="c">foo: , bar: c</ui-a><!--[#]-->`
  )

  t.eq(app.reactive.data, {
    "arr": ["a", "b", "c"],
    "foo": 1,
    "ui-a": {
      0: { bar: { $ref: "/arr/0" } },
      1: { bar: { $ref: "/arr/1" } },
      2: { bar: { $ref: "/arr/2" } },
    },
  })

  app.state.arr[0] = "A"
  await app

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="A">foo: , bar: A</ui-a><!--[#]-->
<ui-a bar="b">foo: , bar: b</ui-a><!--[#]-->
<ui-a bar="c">foo: , bar: c</ui-a><!--[#]-->`
  )

  t.eq(app.reactive.data, {
    "arr": ["A", "b", "c"],
    "foo": 1,
    "ui-a": {
      0: { bar: { $ref: "/arr/0" } },
      1: { bar: { $ref: "/arr/1" } },
      2: { bar: { $ref: "/arr/2" } },
    },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/arr",
    "/arr/0",
    "/arr/1",
    "/arr/0/foo",
    "/arr/1/foo",
    "/arr/2",
    "/arr/2/foo",
  ])

  app.state.arr.length = 1
  await app

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="A">foo: , bar: A</ui-a><!--[#]-->`
  )

  t.eq(app.reactive.data, {
    "arr": ["A"],
    "foo": 1,
    "ui-a": {
      0: { bar: { $ref: "/arr/0" } },
    },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/arr", //
    "/arr/0",
    "/arr/0/foo",
  ])

  app.state.arr.push("B")
  await app

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="A">foo: , bar: A</ui-a><!--[#]-->
<ui-a bar="B">foo: , bar: B</ui-a><!--[#]-->`
  )

  t.eq(app.reactive.data, {
    "arr": ["A", "B"],
    "foo": 1,
    "ui-a": {
      0: { bar: { $ref: "/arr/0" } },
      1: { bar: { $ref: "/arr/1" } },
    },
  })
})

test("array", 2, async (t) => {
  const app = await ui(tmp(true), {
    content: {
      scope: "arr",
      each: [
        "\n",
        {
          tag: "ui-a",
          bar: "{{@index}} - {{.}}",
        },
      ],
    },
    state: { arr: ["a", "b"], foo: 1 },
  })

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="0 - a">foo: , bar: 0 - a</ui-a><!--[#]-->
<ui-a bar="1 - b">foo: , bar: 1 - b</ui-a><!--[#]-->`
  )

  t.eq(app.reactive.data, {
    "arr": ["a", "b"],
    "foo": 1,
    "ui-a": { 0: { bar: "0 - a" }, 1: { bar: "1 - b" } },
  })
})
