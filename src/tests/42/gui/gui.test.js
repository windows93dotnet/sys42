import test from "../../../42/test.js"
import UI from "../../../42/gui/class/UI.js"

test("tag", (t) => {
  const app = new UI({ tag: "em" })
  t.is(app.el.outerHTML, "<em></em>")
})

test("content", (t) => {
  const app = new UI({ tag: "em", content: "hello" })
  t.is(app.el.outerHTML, "<em>hello</em>")
})

test("content", "array", (t) => {
  const app = new UI({
    tag: "em",
    content: ["hello ", { tag: "strong", content: "world" }],
  })
  t.is(app.el.outerHTML, "<em>hello <strong>world</strong></em>")
})

test("content", "shortcuts", (t) => {
  const app = new UI({
    tag: "h1",
    content: ["\n", "hello", "\n\n", "world", "---", "\n"],
  })
  t.is(
    app.el.outerHTML,
    `\
<h1>
hello<br>world<hr>
</h1>`
  )
})

test("data", (t) => {
  const app = new UI({
    tag: "em",
    content: "{{foo}}",
    data: {
      foo: "hi",
    },
  })
  t.is(app.el.outerHTML, "<em>hi</em>")
})

test("data", "reactive", (t) => {
  const app = new UI({
    tag: "em",
    content: "{{foo}}",
    data: {
      foo: "hi",
    },
  })

  t.is(app.el.outerHTML, "<em>hi</em>")

  app.state.foo = "bye"

  t.is(app.el.outerHTML, "<em>bye</em>")
})

test("data", "reactive", "nested", (t) => {
  const app = new UI({
    tag: "em",
    content: "{{foo.bar}}",
    data: {
      foo: { bar: "hi" },
    },
  })

  t.eq(Object.keys(app.ctx.renderers), ["/foo/bar"])
  t.isProxy(app.state.foo)
  t.is(app.el.outerHTML, "<em>hi</em>")

  app.state.foo.bar = "bye"

  t.is(app.el.outerHTML, "<em>bye</em>")
})

test("scope", (t) => {
  const app = new UI({
    tag: "em",
    scope: "foo",
    content: "{{bar}}",
    data: {
      foo: { bar: "hi" },
    },
  })

  t.eq(Object.keys(app.ctx.renderers), ["/foo/bar"])
  t.isProxy(app.state.foo)
  t.is(app.el.outerHTML, "<em>hi</em>")

  app.state.foo.bar = "bye"

  t.is(app.el.outerHTML, "<em>bye</em>")
})

test("scope", "relative scopes", (t) => {
  const app = new UI({
    scope: "a/b/c",
    content: [
      "{{d}}",
      "\n",
      {
        scope: "../",
        content: "{{foo}}",
      },
      "\n",
      {
        scope: "../c",
        content: "{{d}}",
      },
      "\n",
      {
        scope: "../../bar",
        content: "{{.}}",
      },
      "\n",
      {
        scope: "/",
        content: "{{baz}}",
      },
      "\n",
      {
        scope: "/",
        content: "?{{d}}",
      },
    ],
    data: {
      a: {
        b: {
          c: {
            d: 4,
          },
          foo: 3,
        },
        bar: 2,
      },
      baz: 1,
    },
  })

  t.eq(
    Object.entries(app.ctx.renderers).map(([key, val]) => [key, val.size]),
    [
      ["/a/b/c/d", 2],
      ["/a/b/foo", 1],
      ["/a/bar", 1],
      ["/baz", 1],
      ["/d", 1],
    ]
  )

  t.is(
    app.el.outerHTML,
    `\
<div>4
<div>3</div>
<div>4</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )

  app.state.a.b.c.d = "#"

  t.is(
    app.el.outerHTML,
    `\
<div>#
<div>3</div>
<div>#</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )
})

test("scope", "relative template keys", (t) => {
  const app = new UI({
    scope: "a/b/c",
    content: [
      "{{/a.b.c.d}}",
      "\n",
      {
        content: "{{../foo}}",
      },
      "\n",
      {
        content: "{{../c/d}}",
      },
      "\n",
      {
        content: "{{../../bar}}",
      },
      "\n",
      {
        content: "{{/baz}}",
      },
      "\n",
      {
        content: "?{{/d}}",
      },
    ],
    data: {
      a: {
        b: {
          c: {
            d: 4,
          },
          foo: 3,
        },
        bar: 2,
      },
      baz: 1,
    },
  })

  t.eq(
    Object.entries(app.ctx.renderers).map(([key, val]) => [key, val.size]),
    [
      ["/a/b/c/d", 2],
      ["/a/b/foo", 1],
      ["/a/bar", 1],
      ["/baz", 1],
      ["/d", 1],
    ]
  )

  t.is(
    app.el.outerHTML,
    `\
<div>4
<div>3</div>
<div>4</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )

  app.state.a.b.c.d = "#"

  t.is(
    app.el.outerHTML,
    `\
<div>#
<div>3</div>
<div>#</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )
})
