import test from "../../../42/test.js"
import ui from "../../../42/gui.js"

const elements = []
function div(connect = false) {
  const el = document.createElement("div")
  elements.push(el)
  if (connect) document.body.append(el)
  return el
}

test.afterEach(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

test("tag", async (t) => {
  const app = await ui(div(), { tag: "em" })
  t.is(app.el.innerHTML, "<em></em>")
})

test("attributes", async (t) => {
  const app = await ui(div(), { tag: "em", class: "foo" })
  t.is(app.el.innerHTML, '<em class="foo"></em>')
})

test("content", async (t) => {
  const app = await ui(div(), { tag: "em", content: "hello" })

  t.is(app.el.innerHTML, "<em>hello</em>")
})

test("content", "array", async (t) => {
  const app = await ui(div(), {
    tag: "em",
    content: ["hello ", { tag: "strong", content: "world" }],
  })

  t.is(app.el.innerHTML, "<em>hello <strong>world</strong></em>")
})

test("content", "special strings", async (t) => {
  const app = await ui(div(), {
    tag: "h1",
    content: ["\n", "hello", "\n\n", "world", "---", "\n"],
  })

  t.is(
    app.el.innerHTML,
    `\
<h1>
hello<br>world<hr>
</h1>`
  )
})

test.only("reactive data", async (t) => {
  const el = div()
  let app = ui(el, {
    tag: "em",
    content: "{{foo}}",
    class: "{{foo}}",
    style: "color:{{foo}}",
    data: {
      foo: "red",
    },
  })

  await 0

  t.is(el.innerHTML, '<em class="red" style="color: red;">red</em>')

  app = await app

  t.is(app.el.innerHTML, '<em class="red" style="color: red;">red</em>')

  app.data.foo = "tan"
  await 0

  t.is(app.el.innerHTML, '<em class="tan" style="color: tan;">tan</em>')

  delete app.data.foo
  await 0

  t.is(app.el.innerHTML, '<em class="" style=""></em>')
})

test("reactive async data", async (t) => {
  const el = div()
  let app = ui(el, {
    tag: "em",
    content: "{{foo}}",
    class: "{{foo}}",
    style: "color:{{foo}}",
    async data() {
      await t.sleep(100)
      return {
        foo: "red",
      }
    },
  })

  t.is(el.innerHTML, '<em class="" style=""></em>')

  app = await app

  t.is(app.el.innerHTML, '<em class="red" style="color: red;">red</em>')

  app.data.foo = "tan"

  t.is(app.el.innerHTML, '<em class="tan" style="color: tan;">tan</em>')

  delete app.data.foo

  t.is(app.el.innerHTML, '<em class="" style=""></em>')
})

test("reactive data", "array", async (t) => {
  const app = await ui(div(), {
    tag: "em",
    scope: "arr",
    content: ["{{0}}", "{{1}}"],
    data: { arr: ["a", "b"] },
  })

  t.is(app.el.innerHTML, "<em>ab</em>")
})

test.skip("reactive data", "array", async (t) => {
  const app = await ui(div(), {
    tag: "em",
    content: ["{{/0}}", "{{/1}}"],
    data: ["a", "b"],
  })

  t.is(app.el.innerHTML, "<em>ab</em>")
})

test("reactive data", "nested", async (t) => {
  const app = await ui(div(), {
    tag: "em",
    content: "{{foo.bar}}",
    data: {
      foo: { bar: "hi" },
    },
  })

  t.eq(Object.keys(app.ctx.renderers), ["/foo/bar"])
  t.isProxy(app.data.foo)
  t.is(app.el.innerHTML, "<em>hi</em>")

  app.data.foo.bar = "bye"

  t.is(app.el.innerHTML, "<em>bye</em>")
})

test("reactive data", "styles", async (t) => {
  const app = await ui(div(), {
    style: {
      color: "{{foo}}",
      display: "flex",
      flex: 1,
    },
    data: {
      foo: "red",
    },
  })

  t.is(
    app.el.innerHTML,
    '<div style="color: red; display: flex; flex: 1 1 0%;"></div>'
  )

  app.data.foo = "tan"

  t.is(
    app.el.innerHTML,
    '<div style="color: tan; display: flex; flex: 1 1 0%;"></div>'
  )
})

test("scope", async (t) => {
  const app = await ui(div(), {
    tag: "em",
    scope: "foo",
    content: "{{bar}}",
    data: {
      foo: { bar: "hi" },
    },
  })

  t.eq(Object.keys(app.ctx.renderers), ["/foo/bar"])
  t.isProxy(app.data.foo)
  t.is(app.el.innerHTML, "<em>hi</em>")

  app.data.foo.bar = "bye"

  t.is(app.el.innerHTML, "<em>bye</em>")
})

test("scope", "relative scopes", async (t) => {
  const app = await ui(div(), {
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
    app.el.innerHTML,
    `\
<div>4
<div>3</div>
<div>4</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )

  app.data.a.b.c.d = "#"

  t.is(
    app.el.innerHTML,
    `\
<div>#
<div>3</div>
<div>#</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )
})

test("scope", "relative template keys", async (t) => {
  const app = await ui(div(), {
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
    app.el.innerHTML,
    `\
<div>4
<div>3</div>
<div>4</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )

  app.data.a.b.c.d = "#"

  t.is(
    app.el.innerHTML,
    `\
<div>#
<div>3</div>
<div>#</div>
<div>2</div>
<div>1</div>
<div>?</div></div>`
  )
})

/* filters
========== */

const uppercase = (str) => str.toUpperCase()

test("filters", async (t) => {
  const app = await ui(div(), {
    content: "a {{foo|uppercase}}",
    data: { foo: "b" },
    filters: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")
})
