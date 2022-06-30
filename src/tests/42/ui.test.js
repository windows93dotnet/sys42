import test from "../../42/test.js"
import ui from "../../42/ui.js"

const tmp = test.utils.container({ id: "ui-tests" })

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

/* reactivity
============= */

test("template", async (t) => {
  const app = ui(tmp(), `Hello {{world}}`)
  await app
  t.is(app.el.textContent, "Hello ")

  app.data.world = "World"
  await app

  t.is(app.el.textContent, "Hello World")

  app.data.world = "Derp"
  await app

  t.is(app.el.textContent, "Hello Derp")

  app.data.world = 0
  await app

  t.is(app.el.textContent, "Hello 0")

  app.data.world = undefined
  await app

  t.is(app.el.textContent, "Hello ")
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

test("reactive data", "array as data", async (t) => {
  let app = await ui(tmp(), {
    tag: "em",
    content: ["{{/0}}", "{{/1}}"],
    data: ["a", "b"],
  })

  t.is(app.el.innerHTML, "<em>ab</em>")

  app = await ui(tmp(), {
    tag: "em",
    content: ["{{./0}}", "{{./1}}"],
    data: ["a", "b"],
  })

  t.is(app.el.innerHTML, "<em>ab</em>")
})

test("reactive data", "nested", async (t) => {
  const app = await ui(tmp(), {
    tag: "em",
    content: "{{foo/bar}}",
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

/* update throttle
==================
One update on idle or every animation frame */

test("update throttle", async (t) => {
  const app = await ui(tmp(), {
    content: "{{a}}{{b}}{{c}}",
    data: { a: "a", b: "b", c: "c" },
  })

  t.is(app.state.throttle, true)

  const stub = t.stub()

  app.state.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.data.a = "A"
  app.data.b = "B"
  app.data.c = "C"

  t.is(stub.count, 0)

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 1)
  t.eq(stub.calls, [
    {
      args: [new Set(["/a", "/b", "/c"])],
    },
  ])

  t.is(app.state.throttle, true)
})

test("update throttle", "using throttle:false", async (t) => {
  const app = await ui(tmp(), {
    content: "{{a}}{{b}}{{c}}",
    data: { a: "a", b: "b", c: "c" },
  })

  app.state.throttle = false

  const stub = t.stub()

  app.state.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.data.a = "A"
  app.data.b = "B"
  app.data.c = "C"

  t.is(stub.count, 3)

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 3)
  t.eq(stub.calls, [
    { args: [new Set(["/a"])] },
    { args: [new Set(["/b"])] },
    { args: [new Set(["/c"])] },
  ])

  t.is(app.state.throttle, false)
})

test("update throttle", "using updateNow", async (t) => {
  const app = await ui(tmp(), {
    content: "{{a}}{{b}}{{c}}",
    data: { a: "a", b: "b", c: "c" },
  })

  t.is(app.state.throttle, true)

  const stub = t.stub()

  app.state.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.state.value.a = "A"
  app.state.value.b = "B"
  app.state.value.c = "C"
  app.state.updateNow("/a")
  app.state.updateNow("/b")
  app.state.updateNow("/c")

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 3)
  t.eq(stub.calls, [
    { args: [new Set(["/a"])] },
    { args: [new Set(["/b"])] },
    { args: [new Set(["/c"])] },
  ])

  t.is(app.state.throttle, true)
})

test("update throttle", "using silent:true", async (t) => {
  const app = await ui(tmp(), {
    content: "{{a}}{{b}}{{c}}",
    data: { a: "a", b: "b", c: "c" },
  })

  t.is(app.state.throttle, true)

  const stub = t.stub()

  app.state.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.state.set("/a", "A", { silent: true })
  app.state.set("/b", "B", { silent: true })
  app.state.set("/c", "C", { silent: true })
  app.state.updateNow("/a")
  app.state.updateNow("/b")
  app.state.updateNow("/c")

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 3)
  t.eq(stub.calls, [
    { args: [new Set(["/a"])] },
    { args: [new Set(["/b"])] },
    { args: [new Set(["/c"])] },
  ])

  t.is(app.state.throttle, true)
})

/* scope
======== */

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
      "{{/a/b/c/d}}",
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

/* class
======== */

test("class", "string", async (t) => {
  const app = await ui(tmp(), {
    tag: "em",
    class: "{{a}} {{b}}",
    data: {
      a: "x",
      b: "y",
    },
  })

  t.is(app.el.innerHTML, '<em class="x y"></em>')

  app.data.a = "a"
  await app

  t.is(app.el.innerHTML, '<em class="a y"></em>')

  delete app.data.b
  await app

  t.is(app.el.innerHTML, '<em class="a "></em>')
})

test("class", "array", async (t) => {
  const app = await ui(tmp(), {
    tag: "em",
    class: ["{{a}}", "{{b}}"],
    data: {
      a: "x",
      b: "y",
    },
  })

  t.is(app.el.innerHTML, '<em class="x y"></em>')

  app.data.a = "a"
  await app

  t.is(app.el.innerHTML, '<em class="a y"></em>')

  delete app.data.b
  await app

  t.is(app.el.innerHTML, '<em class="a "></em>')
})

test("class", "object", async (t) => {
  const app = await ui(tmp(), {
    tag: "em",
    class: { a: "{{a}}", b: "{{b}}" },
    data: {
      a: true,
      b: true,
    },
  })

  t.is(app.el.innerHTML, '<em class="a b"></em>')

  app.data.a = false
  await app

  t.is(app.el.innerHTML, '<em class="b"></em>')

  app.data.b = undefined
  await app

  t.is(app.el.innerHTML, '<em class=""></em>')

  app.data.b = true
  await app

  t.is(app.el.innerHTML, '<em class="b"></em>')

  app.data.a = 1
  await app

  t.is(app.el.innerHTML, '<em class="b a"></em>')
})

/* abbreviations
================ */

test.tasks(
  [
    {
      def: { tag: "span#foo.bar" },
      expected: '<span id="foo" class="bar"></span>',
    },
    {
      def: { tag: "span#foo.bar", id: "x" },
      expected: '<span id="x" class="bar"></span>',
    },
    {
      def: { tag: "span#foo.bar", class: "baz" },
      expected: '<span id="foo" class="baz bar"></span>',
    },
  ],
  ({ def, expected }) => {
    test("abbr", `expand`, def, async (t) => {
      const app = await ui(tmp(), def)
      t.is(app.el.innerHTML, expected)
    })
  }
)

test("abbr", "reactive", async (t) => {
  const app = ui(tmp(), {
    tag: "em#{{foo}}",
    data: {
      foo: "bar",
    },
  })

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em id="bar"></em>')

  app.data.foo = "baz"
  await app

  t.is(app.el.innerHTML, '<em id="baz"></em>')
})

test("abbr", "reactive", 2, async (t) => {
  const app = ui(tmp(), {
    tag: "em#{{foo}}.{{a}}.{{b}}",
    data: {
      foo: "bar",
      a: "x",
      b: "y",
    },
  })

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em id="bar" class="x y"></em>')

  app.data.foo = "baz"
  app.data.b = "z"
  await app

  t.is(app.el.innerHTML, '<em id="baz" class="x z"></em>')

  delete app.data.b
  await app

  t.is(app.el.innerHTML, '<em id="baz" class="x "></em>')

  delete app.data.foo
  await app

  t.is(app.el.innerHTML, '<em class="x "></em>')

  delete app.data.a
  await app

  t.is(app.el.innerHTML, '<em class=" "></em>')
})

/* filters
========== */

const uppercase = (str) => str.toUpperCase()

test("filters", async (t) => {
  const app = await ui(tmp(), {
    content: "a {{foo|>uppercase}}",
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
    content: "a {{'b'|>uppercase}}",
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
    content: "{{foo|>stringify}}",
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
    content: "a {{foo|>uppercase}}",
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

test("filters", "nested action", async (t) => {
  t.plan(3)
  const app = await ui(tmp(), {
    tag: "em",
    content: "a {{foo|>foo.bar}}",
    data: { foo: "b" },
    actions: {
      foo: {
        bar(str) {
          t.is(this.el.localName, "em")
          t.eq(this.state.value, { foo: "b" })
          return str.toUpperCase()
        },
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
      "{{foo|>uppercase}}",
      { tag: "em", content: "{{foo|>uppercase}}" },
      { tag: "strong", content: "{{foo|>uppercase}}" },
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
    content: "{{foo|>stringify('min')}}",
    // content: "{{foo|>stringify.min}}",
    data: { foo: { a: 1 } },
  })

  t.is(app.el.innerHTML, "<pre>{a:1}</pre>")
})

test("filters", "pluralize", async (t) => {
  const app = await ui(tmp(), {
    content: "{{'apple'|>pluralize}}, {{'orange'|>pluralize(5)}}",
  })

  t.is(app.el.innerHTML, "apples, oranges")
})

/* if
======= */

test("if", async (t) => {
  const app = await ui(tmp(), {
    content: { if: "{{a.b}}", content: "x" },
    data: {
      a: { b: false },
    },
  })

  t.is(app.el.textContent, "")

  app.data.a.b = true
  await app

  t.is(app.el.textContent, "x")

  app.data.a.b = false
  await app

  t.is(app.el.textContent, "")
})

test("if", "array", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      content: [{ if: "{{0}}", content: "x" }],
    },
    data: {
      arr: [false],
    },
  })

  t.is(app.el.textContent, "")

  app.data.arr[0] = true
  await app

  t.is(app.el.textContent, "x")

  app.data.arr[0] = false
  await app

  t.is(app.el.textContent, "")
})

test("if", "else", async (t) => {
  const app = await ui(tmp(), {
    content: [{ if: "{{a.b}}", content: "x", else: "y" }],
    data: {
      a: { b: true },
    },
  })

  t.is(app.el.textContent, "x")

  app.data.a.b = false
  await app

  t.is(app.el.textContent, "y")

  app.data.a.b = true
  await app

  t.is(app.el.textContent, "x")
})

test("if", "else with empty content", async (t) => {
  const app = await ui(tmp(), {
    content: [{ if: "{{a.b}}", content: "x", else: [] }],
    data: {
      a: { b: true },
    },
  })

  t.is(app.el.textContent, "x")

  app.data.a.b = false
  await app

  t.is(app.el.textContent, "")

  app.data.a.b = true
  await app

  t.is(app.el.textContent, "x")
})

test("if", "nodes", async (t) => {
  const app = await ui(tmp(), {
    content: [
      {
        if: "{{a.b}}",
        content: [
          "x", //
          { tag: "em", content: "y" },
        ],
      },
    ],
    data: {
      a: { b: false },
    },
  })

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")

  app.data.a.b = true
  await app

  t.is(app.el.textContent, "xy")
  t.is(app.el.innerHTML, "<!--[if]-->x<em>y</em>")

  app.data.a.b = false
  await app

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")
})

test("if", "element", async (t) => {
  const app = await ui(tmp(), {
    content: [
      {
        if: "{{a.b}}",
        tag: "div",
        content: [
          "x", //
          { tag: "em", content: "y" },
        ],
      },
    ],
    data: {
      a: { b: false },
    },
  })

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")

  app.data.a.b = true
  await app

  t.is(app.el.textContent, "xy")
  t.is(app.el.innerHTML, "<!--[if]--><div>x<em>y</em></div>")

  app.data.a.b = false
  await app

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")
})

test("if", "bug using state.update", async (t) => {
  const app = await ui(tmp(), {
    content: [
      {
        tag: "div",
        if: "{{a && b}}",
        content: "{{b}}",
      },
    ],
    data: {
      a: false,
      b: false,
    },
  })

  t.is(app.el.innerHTML, "<!--[if]-->")
  t.is(app.el.textContent, "")

  app.data.a = true
  await app

  t.is(app.el.textContent, "")

  app.data.b = true
  await app

  t.is(app.el.textContent, "true")

  app.ctx.state.update("/a")
  await app

  t.is(app.el.textContent, "true")

  app.data.a = false
  await app

  t.is(app.el.textContent, "")
})

/* data array
============= */

test("array", async (t) => {
  const app = await ui(tmp(), {
    tag: "em",
    content: [
      "{{arr/0}}", //
      "{{arr/1}}",
    ],
    data: {
      arr: ["a", "b"],
    },
  })

  t.is(app.el.innerHTML, "<em>ab</em>")

  app.data.arr.push("c")
  await app

  t.is(app.el.innerHTML, "<em>ab</em>")

  app.data.arr[0] = "A"
  await app

  t.is(app.el.innerHTML, "<em>Ab</em>")

  app.data.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<em>A</em>")
})

/* each
========= */

test("each", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{.}}" },
  })

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[each]-->")

  app.data.arr = [1, 2, 3]
  await app

  t.is(app.el.textContent, "123")
  const childNodes = [...app.el.childNodes]
  t.is(childNodes[1].textContent, "1")

  app.data.arr.push(4)
  await app

  t.is(app.el.textContent, "1234")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])
  t.is(childNodes[3], app.el.childNodes[3])

  app.data.arr.length = 2
  await app

  t.is(app.el.textContent, "12")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.data.arr[0] = "a"
  await app

  t.is(app.el.textContent, "a2")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.data.arr[1] = "b"
  await app

  t.is(app.el.textContent, "ab")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.data.arr.length = 0
  await app
  t.is(app.el.textContent, "")
})

test("each", "def", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: {
        tag: "span",
        content: "{{.}}",
      },
    },
    data: { arr: ["a", "b"] },
  })

  t.is(app.el.textContent, "ab")
  t.is(
    app.el.innerHTML,
    "<!--[each]--><span>a</span><!--[#]--><span>b</span><!--[#]-->"
  )

  app.data.arr.push("c")
  await app

  t.is(app.el.textContent, "abc")
  t.is(
    app.el.innerHTML,
    "<!--[each]--><span>a</span><!--[#]--><span>b</span><!--[#]--><span>c</span><!--[#]-->"
  )

  app.data.arr.length = 1
  await app

  t.is(app.el.textContent, "a")
  t.is(app.el.innerHTML, "<!--[each]--><span>a</span><!--[#]-->")

  app.data.arr.length = 0
  await app

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[each]-->")

  app.data.arr.push("x")
  await app

  t.is(app.el.textContent, "x")
  t.is(app.el.innerHTML, "<!--[each]--><span>x</span><!--[#]-->")
})

test("each", "splice", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{.}}" },
  })

  app.data.arr = [1, 2, 3]
  await app

  t.is(app.el.textContent, "123")

  app.data.arr.splice(1, 1)
  await app

  t.is(app.el.textContent, "13")
})

test("each", "array with objects", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: {
        tag: "span",
        content: "{{x}}",
        class: "{{y}}",
      },
    },
    data: {
      arr: [
        { x: "A", y: "1" },
        { x: "B", y: "2" },
      ],
    },
  })

  t.is(
    app.el.innerHTML,
    '<!--[each]--><span class="1">A</span><!--[#]--><span class="2">B</span><!--[#]-->'
  )

  app.data.arr[0].x = "foo"
  await app
  t.is(
    app.el.innerHTML,
    '<!--[each]--><span class="1">foo</span><!--[#]--><span class="2">B</span><!--[#]-->'
  )

  app.data.arr = [{ x: "Z", y: "9" }]
  await app
  t.is(app.el.innerHTML, '<!--[each]--><span class="9">Z</span><!--[#]-->')
})

test("each", "render index 0 bug", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: {
        tag: "div",
        content: "{{path}}",
      },
    },
    data: {
      arr: [{ path: "A" }],
    },
  })

  await app

  t.is(app.el.children.length, 1)
  t.is(app.el.textContent, "A")

  app.data.arr = [{ path: "Z" }]
  await app

  t.is(app.el.children.length, 1)
  t.is(app.el.textContent, "Z")
  t.is(app.el.innerHTML, "<!--[each]--><div>Z</div><!--[#]-->")

  app.data.arr = [{ path: "X" }, { path: "Y" }]
  await app

  t.is(
    app.el.innerHTML,
    "<!--[each]--><div>X</div><!--[#]--><div>Y</div><!--[#]-->"
  )
  t.is(app.el.children.length, 2)
  t.is(app.el.textContent, "XY")
})

test("each", "innerHTML", async (t) => {
  const app = await ui(tmp(), {
    content: [
      {
        scope: "arr",
        tag: "ul",
        each: { tag: "li", content: "{{.}}" },
      },
    ],
    data: { arr: [1, 2, 3] },
  })

  t.is(app.el.textContent, "123")
  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>1</li><!--[#]--><li>2</li><!--[#]--><li>3</li><!--[#]--></ul>"
  )

  app.data.arr.push(4)
  await app

  t.is(app.el.textContent, "1234")
  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>1</li><!--[#]--><li>2</li><!--[#]--><li>3</li><!--[#]--><li>4</li><!--[#]--></ul>"
  )

  app.data.arr.length = 2
  await app

  t.is(app.el.textContent, "12")
  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>1</li><!--[#]--><li>2</li><!--[#]--></ul>"
  )
})

test("each", "element", "scopped", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ul",
      scope: "a.b",
      each: { tag: "li", content: "{{.}}" },
    },
    data: { a: { b: ["foo", "bar"] } },
  })

  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>foo</li><!--[#]--><li>bar</li><!--[#]--></ul>"
  )

  app.data.a.b.push("baz")
  await app

  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>foo</li><!--[#]--><li>bar</li><!--[#]--><li>baz</li><!--[#]--></ul>"
  )

  app.data.a.b.length = 0
  // app.data.a.b = []
  await app

  t.is(app.el.innerHTML, "<ul><!--[each]--></ul>")
})

test("each", "array of objects", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{a}} - {{b}} - " },
    data: {
      arr: [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    },
  })

  t.is(app.el.textContent, "1 - 2 - 3 - 4 - ")
})

test("each", "array of objects", "scopped", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{a}} - {{b}} - " },
    data: {
      arr: [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    },
  })

  t.is(app.el.innerHTML, "<!--[each]-->1 - 2 - <!--[#]-->3 - 4 - <!--[#]-->")
  t.is(app.el.textContent, "1 - 2 - 3 - 4 - ")

  app.data.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<!--[each]-->1 - 2 - <!--[#]-->")
  t.is(app.el.textContent, "1 - 2 - ")

  app.data.arr = undefined
  await app

  t.is(app.el.innerHTML, "<!--[each]-->")
  t.is(app.el.textContent, "")

  app.data.arr = [{ a: "a", b: "b" }]
  await app

  t.is(app.el.textContent, "a - b - ")

  app.data.arr[0].a = "x"
  delete app.data.arr[0].b
  await app

  t.is(app.el.textContent, "x -  - ")

  delete app.data.arr
  await app

  t.is(app.el.textContent, "")
})

test("each", "access root data", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{a}} {{/foo}} " },
    data: {
      foo: "bar",
      arr: [{ a: 1 }, { a: 2 }],
    },
  })

  t.is(app.el.textContent, "1 bar 2 bar ")
})

test("each", "access data in previous level", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "baz/arr",
      each: "{{a}} {{foo ?? ../../foo}} {{/x}} {{../../hello}} - ",
    },
    data: {
      foo: "bar",
      x: "y",
      baz: {
        foo: "baz",
        hello: "world",
        arr: [{ a: 1, foo: "derp" }, { a: 2 }],
      },
    },
  })

  t.is(app.el.textContent, "1 derp y world - 2 baz y world - ")
})

test("each", "lastChild bug", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      content: [{ each: [{ content: "{{a}}" }] }, { content: "z" }],
    },
    data: {
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(app.el.innerHTML, "<!--[each]-->x<!--[#]-->y<!--[#]-->z")

  app.data.arr.push({ a: "a" })
  await app

  t.is(app.el.innerHTML, "<!--[each]-->x<!--[#]-->y<!--[#]-->a<!--[#]-->z")

  app.data.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<!--[each]-->x<!--[#]-->z")

  delete app.data.arr
  await app

  t.is(app.el.innerHTML, "<!--[each]-->z")
})

test("each", "range bug", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      content: [
        { each: "{{a}}" }, //
        { content: "+" },
        { each: "{{a}}" },
      ],
    },

    data: {
      arr: [{ a: 1 }, { a: 2 }],
    },
  })

  t.is(
    app.el.innerHTML,
    "<!--[each]-->1<!--[#]-->2<!--[#]-->+<!--[each]-->1<!--[#]-->2<!--[#]-->"
  )

  app.data.arr.push({ a: 3 })
  await app

  t.is(
    app.el.innerHTML,
    "<!--[each]-->1<!--[#]-->2<!--[#]-->3<!--[#]-->+<!--[each]-->1<!--[#]-->2<!--[#]-->3<!--[#]-->"
  )

  app.data.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<!--[each]-->1<!--[#]-->+<!--[each]-->1<!--[#]-->")
})

test("each", "relative paths", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "baz/arr",
      each: "{{a}} {{foo ?? ../../foo}} {{../../foo}} {{/foo}} - ",
    },
    data: {
      foo: "bar",
      baz: {
        foo: "baz",
        arr: [{ a: 1, foo: "derp" }, { a: 2 }],
      },
    },
  })

  t.is(app.el.textContent, "1 derp baz bar - 2 baz baz bar - ")
})

test("each", "@index", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{@index}} {{a}} " },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(app.el.textContent, "0 x 1 y ")
})

test("each", "@index", "string array", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{@index}} {{.}} " },
    data: {
      foo: "bar",
      arr: ["x", "y"],
    },
  })

  t.is(app.el.textContent, "0 x 1 y ")
})

test("each", "#", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: ["{{#}} {{a}}\n", "{{##}} {{a}}\n", "{{###}} {{a}}\n"],
    },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(
    app.el.textContent,
    `\
0 x
00 x
000 x
1 y
01 y
001 y
`
  )
})

test("each", "#", "string array", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: ["{{#}} {{.}}\n", "{{##}} {{.}}\n", "{{###}} {{.}}\n"],
    },
    data: {
      foo: "bar",
      arr: ["x", "y"],
    },
  })

  t.is(
    app.el.textContent,
    `\
0 x
00 x
000 x
1 y
01 y
001 y
`
  )
})

test("each", "@last", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{##}}:{{a}}{{@last ? '' : ', '}}" },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(app.el.textContent, "00:x, 01:y")
})

test("each", "@first", async (t) => {
  const app = await ui(tmp(), {
    content: { scope: "arr", each: "{{@first ? ' - ' : ''}}{{##}}:{{a}} " },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }, { a: "z" }],
    },
  })

  t.is(app.el.textContent, " - 00:x 01:y 02:z ")
})

test("each", "@last element", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: ["{{@index}} {{a}}", { tag: "br", if: "{{!@last}}" }],
    },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(
    app.el.innerHTML,
    "<!--[each]-->0 x<!--[if]--><br><!--[#]-->1 y<!--[if]--><!--[#]-->"
  )
})

test("each", "@first element", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: [{ tag: "hr", if: "{{!@last}}" }, "{{@index}} {{a}}"],
    },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(
    app.el.innerHTML,
    "<!--[each]--><!--[if]--><hr>0 x<!--[#]--><!--[if]-->1 y<!--[#]-->"
  )
})

test("each", "input element", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: [{ tag: "textarea", name: "./a" }],
    },
    data: {
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  let ta = app.queryAll("textarea")
  t.is(ta.length, 2)
  t.is(ta[0].name, "/arr/0/a")
  t.is(ta[0].value, "x")
  t.is(ta[1].name, "/arr/1/a")
  t.is(ta[1].value, "y")

  // app.data.arr.pop()
  app.data.arr = [{ a: "z" }]
  await app

  ta = app.queryAll("textarea")
  t.is(ta.length, 1)
  t.is(ta[0].name, "/arr/0/a")
  t.is(ta[0].value, "z")
})

/* computed
=========== */

test("computed", async (t) => {
  t.plan(6)

  const app = await ui(tmp(), {
    content: {
      scope: "parsed",
      content: "foo: {{0}}, bar: {{1}}",
    },

    data: {
      formated: "FOO/BAR",
    },

    computed: {
      parsed: "{{formated|>split('/')}}",
    },
  })

  const updates = ["/formated", "/parsed"]
  app.state.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  t.eq(app.data.parsed, ["FOO", "BAR"])
  t.eq(app.state.value, {
    formated: "FOO/BAR",
  })

  t.is(app.el.innerHTML, "foo: FOO, bar: BAR")

  app.data.formated = "HELLO/WORLD"
  await app

  t.is(app.el.innerHTML, "foo: HELLO, bar: WORLD")
})

/* actions
========== */

test("on", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "button",
      content: "cnt: {{cnt}}",
      on: { click: "{{cnt += 1}}" },
    },

    data: {
      cnt: 42,
    },
  })

  t.eq(app.data, { cnt: 42 })

  const el = app.query("button")

  el.click()
  t.eq(app.data, { cnt: 42 })
  await app
  t.eq(app.data, { cnt: 43 })
})

test("on", "actions", async (t) => {
  t.plan(4)
  const app = await ui(tmp(), {
    content: {
      tag: "button",
      content: "cnt: {{cnt}}",
      on: { click: "{{incr(10, e)}}" },
    },

    data: {
      cnt: 42,
    },

    actions: {
      incr(n, e) {
        t.instanceOf(e, PointerEvent)
        this.data.cnt += n
      },
    },
  })

  t.eq(app.data, { cnt: 42 })

  const el = app.query("button")

  el.click()
  t.eq(app.data, { cnt: 42 })
  await app
  t.eq(app.data, { cnt: 52 })

  app.destroy()
  el.click()
  await app
})
