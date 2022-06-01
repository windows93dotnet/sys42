import test from "../../../42/test.js"
import ui from "../../../42/gui.js"

const elements = []
function tmp(connect = false) {
  const el = document.createElement("section")
  elements.push(el)
  if (connect) document.body.append(el)
  return el
}

test.afterEach(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

test("tag", (t) => {
  const app = ui(tmp(), { tag: "em" })
  t.is(app.el.innerHTML, "<em></em>")
})

test("attributes", (t) => {
  const app = ui(tmp(), { tag: "em", class: "foo" })
  t.is(app.el.innerHTML, '<em class="foo"></em>')
})

test("content", (t) => {
  const app = ui(tmp(), { tag: "em", content: "hello" })

  t.is(app.el.innerHTML, "<em>hello</em>")
})

test("content", "array", (t) => {
  const app = ui(tmp(), {
    tag: "em",
    content: ["hello ", { tag: "strong", content: "world" }],
  })

  t.is(app.el.innerHTML, "<em>hello <strong>world</strong></em>")
})

test("content", "special strings", (t) => {
  const app = ui(tmp(), {
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

test("reactive data", async (t) => {
  const app = ui(tmp(), {
    tag: "em",
    content: "{{foo}}",
    data: {
      foo: "red",
    },
  })

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, "<em>red</em>")

  app.data.foo = "tan"
  await app

  t.is(app.el.innerHTML, "<em>tan</em>")

  delete app.data.foo
  await app

  t.is(app.el.innerHTML, "<em></em>")
})

test("reactive data", "attributes", async (t) => {
  const app = ui(tmp(), {
    tag: "em",
    content: "{{foo}}",
    class: "{{foo}}",
    style: "color:{{foo}}",
    data: {
      foo: "red",
    },
  })

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em class="red" style="color: red;">red</em>')

  app.data.foo = "tan"
  await app

  t.is(app.el.innerHTML, '<em class="tan" style="color: tan;">tan</em>')

  delete app.data.foo
  await app

  t.is(app.el.innerHTML, '<em style=""></em>')

  // await test.utils.repaint()
  // t.is(app.el.innerHTML, "<em></em>")
})

test("reactive async data", async (t) => {
  const app = ui(tmp(), {
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

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em class="red" style="color: red;">red</em>')

  app.data.foo = "tan"
  await app

  t.is(app.el.innerHTML, '<em class="tan" style="color: tan;">tan</em>')

  delete app.data.foo
  await app

  t.is(app.el.innerHTML, '<em style=""></em>')

  // await test.utils.repaint()
  // t.is(app.el.innerHTML, "<em></em>")
})

test("reactive data", "array", async (t) => {
  const app = await ui(tmp(), {
    tag: "em",
    scope: "arr",
    content: ["{{0}}", "{{1}}"],
    data: { arr: ["a", "b"] },
  })

  t.is(app.el.innerHTML, "<em>ab</em>")
})

// test.skip("reactive data", "array", async (t) => {
//   const app = await ui(div(), {
//     tag: "em",
//     content: ["{{/0}}", "{{/1}}"],
//     data: ["a", "b"],
//   })

//   t.is(app.el.innerHTML, "<em>ab</em>")
// })

test("reactive data", "nested", async (t) => {
  const app = await ui(tmp(), {
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
  await app

  t.is(app.el.innerHTML, "<em>bye</em>")

  app.ctx.cancel()
  t.eq(Object.keys(app.ctx.renderers), [])
})

test("reactive data", "styles", async (t) => {
  const app = await ui(tmp(), {
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
  await app

  t.is(
    app.el.innerHTML,
    '<div style="color: tan; display: flex; flex: 1 1 0%;"></div>'
  )
})

test("scope", async (t) => {
  const app = await ui(tmp(), {
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
  await app

  t.is(app.el.innerHTML, "<em>bye</em>")
})

test("scope", "relative scopes", async (t) => {
  const app = await ui(tmp(), {
    scope: "a/b/c",
    content: [
      "{{d}}",
      "\n",
      { scope: "../", content: "{{foo}}" },
      "\n",
      { scope: "../c", content: "{{d}}" },
      "\n",
      { scope: "../../bar", content: "{{.}}" },
      "\n",
      { scope: "/", content: "{{baz}}" },
      "\n",
      { scope: "/", content: "?{{d}}" },
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
4
3
4
2
1
?`
  )

  app.data.a.b.c.d = "#"
  await app

  t.is(
    app.el.innerHTML,
    `\
#
3
#
2
1
?`
  )
})

test("scope", "relative template keys", async (t) => {
  const app = await ui(tmp(), {
    scope: "a/b/c",
    content: [
      "{{/a.b.c.d}}",
      "\n",
      { content: "{{../foo}}" },
      "\n",
      { content: "{{../c/d}}" },
      "\n",
      { content: "{{../../bar}}" },
      "\n",
      { content: "{{/baz}}" },
      "\n",
      { content: "?{{/d}}" },
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
4
3
4
2
1
?`
  )

  app.data.a.b.c.d = "#"
  await app

  t.is(
    app.el.innerHTML,
    `\
#
3
#
2
1
?`
  )
})

/* filters
========== */

const uppercase = (str) => str.toUpperCase()

test("filters", async (t) => {
  const app = await ui(tmp(), {
    content: "a {{foo|uppercase}}",
    data: { foo: "b" },
    actions: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")

  app.data.foo = "x"
  await app

  t.is(app.el.innerHTML, "a X")
})

test("filters", "as function", async (t) => {
  const app = await ui(tmp(), {
    content: "a {{uppercase(foo)}}",
    data: { foo: "b" },
    actions: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")

  app.data.foo = "x"
  await app

  t.is(app.el.innerHTML, "a X")
})

test("filters", "inline variable", async (t) => {
  const app = await ui(tmp(), {
    content: "a {{'b'|uppercase}}",
    actions: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")
})

test("filters", "inline variable", "as function", async (t) => {
  const app = await ui(tmp(), {
    content: "a {{uppercase('b')}}",
    actions: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")
})

test("filters", "buildin filters", async (t) => {
  const app = await ui(tmp(), {
    tag: "pre",
    content: "{{foo|stringify}}",
    data: { foo: { a: 1 } },
  })

  t.is(
    app.el.innerHTML,
    `\
<pre>{
  a: 1,
}</pre>`
  )
})

test("filters", "thisArg", async (t) => {
  t.plan(3)
  const app = await ui(tmp(), {
    tag: "em",
    content: "a {{foo|uppercase}}",
    data: { foo: "b" },
    actions: {
      uppercase(str) {
        t.is(this.el.localName, "em")
        t.eq(this.state.value, { foo: "b" })
        return str.toUpperCase()
      },
    },
  })

  t.is(app.el.innerHTML, "<em>a B</em>")
})

test("filters", "thisArg", "nested", async (t) => {
  t.plan(8)

  const tags = ["section", "em", "strong"]
  let cnt = 0

  const app = await ui(tmp(), {
    content: [
      "{{foo|uppercase}}",
      { tag: "em", content: "{{foo|uppercase}}" },
      { tag: "strong", content: "{{foo|uppercase}}" },
    ],
    data: { foo: "b" },
    actions: {
      uppercase(str) {
        t.is(this.el.localName, tags[cnt++])
        return str.toUpperCase()
      },
    },
  })

  t.is(app.el.innerHTML, "B<em>B</em><strong>B</strong>")

  cnt = 0
  app.data.foo = "x"
  await app

  t.is(app.el.innerHTML, "X<em>X</em><strong>X</strong>")
})

test("filters", "buildin filters locate", async (t) => {
  const app = await ui(tmp(), {
    tag: "pre",
    content: "{{foo|stringify('min')}}",
    // content: "{{foo|stringify.min}}",
    data: { foo: { a: 1 } },
  })

  t.is(app.el.innerHTML, "<pre>{a:1}</pre>")
})
