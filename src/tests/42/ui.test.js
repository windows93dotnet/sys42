import test from "../../42/test.js"
import ui from "../../42/ui.js"

test("tag", (t) => {
  const app = t.utils.decay(ui(t.utils.dest(), { tag: "em" }))
  t.is(app.el.innerHTML, "<em></em>")
})

test("attributes", (t) => {
  const app = t.utils.decay(ui(t.utils.dest(), { tag: "em", class: "foo" }))
  t.is(app.el.innerHTML, '<em class="foo"></em>')
})

test("content", (t) => {
  const app = t.utils.decay(ui(t.utils.dest(), { tag: "em", content: "hello" }))

  t.is(app.el.innerHTML, "<em>hello</em>")
})

test("content", "array", (t) => {
  const app = t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: ["hello ", { tag: "strong", content: "world" }],
    })
  )

  t.is(app.el.innerHTML, "<em>hello <strong>world</strong></em>")
})

test("content", "special strings", (t) => {
  const app = t.utils.decay(
    ui(t.utils.dest(), {
      tag: "h1",
      content: ["\n", "hello", "\n\n", "world", "---", "\n"],
    })
  )

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
  const app = t.utils.decay(ui(t.utils.dest(), `Hello {{world}}`))
  await app
  t.is(app.el.textContent, "Hello ")

  app.state.world = "World"
  await app

  t.is(app.el.textContent, "Hello World")

  app.state.world = "Derp"
  await app

  t.is(app.el.textContent, "Hello Derp")

  app.state.world = 0
  await app

  t.is(app.el.textContent, "Hello 0")

  app.state.world = undefined
  await app

  t.is(app.el.textContent, "Hello ")
})

test("reactive data", async (t) => {
  const app = t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: "{{foo}}",
      state: {
        foo: "red",
      },
    })
  )

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, "<em>red</em>")

  app.state.foo = "tan"
  await app

  t.is(app.el.innerHTML, "<em>tan</em>")

  delete app.state.foo
  await app

  t.is(app.el.innerHTML, "<em></em>")
})

test("reactive data", "attributes", async (t) => {
  const app = t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: "{{foo}}",
      class: "{{foo}}",
      style: "color:{{foo}}",
      state: {
        foo: "red",
      },
    })
  )

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em class="red" style="color: red;">red</em>')

  app.state.foo = "tan"
  await app

  t.is(app.el.innerHTML, '<em class="tan" style="color: tan;">tan</em>')

  delete app.state.foo
  await app

  t.is(app.el.innerHTML, '<em class="" style=""></em>')
})

test("reactive async state", async (t) => {
  const app = t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: "{{foo}}",
      class: "{{foo}}",
      style: "color:{{foo}}",
      async state() {
        await t.sleep(100)
        return {
          foo: "red",
        }
      },
    })
  )

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em class="red" style="color: red;">red</em>')

  app.state.foo = "tan"
  await app

  t.is(app.el.innerHTML, '<em class="tan" style="color: tan;">tan</em>')

  delete app.state.foo
  await app

  t.is(app.el.innerHTML, '<em class="" style=""></em>')
})

test("reactive data", "array", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      scope: "arr",
      content: ["{{0}}", "{{1}}"],
      state: { arr: ["a", "b"] },
    })
  )

  t.is(app.el.innerHTML, "<em>ab</em>")
})

test("reactive data", "array as data", async (t) => {
  let app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: ["{{/0}}", "{{/1}}"],
      state: ["a", "b"],
    })
  )

  t.is(app.el.innerHTML, "<em>ab</em>")

  app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: ["{{./0}}", "{{./1}}"],
      state: ["a", "b"],
    })
  )

  t.is(app.el.innerHTML, "<em>ab</em>")
})

test("reactive data", "nested", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: "{{foo/bar}}",
      state: {
        foo: { bar: "hi" },
      },
    })
  )

  t.eq(Object.keys(app.ctx.renderers), ["/foo/bar"])
  t.isProxy(app.state.foo)
  t.is(app.el.innerHTML, "<em>hi</em>")

  app.state.foo.bar = "bye"
  await app

  t.is(app.el.innerHTML, "<em>bye</em>")

  app.ctx.cancel()
  t.eq(Object.keys(app.ctx.renderers), [])
})

test("reactive data", "styles", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      style: {
        color: "{{foo}}",
        display: "flex",
        flex: 1,
      },
      state: {
        foo: "red",
      },
    })
  )

  t.is(
    app.el.innerHTML,
    '<div style="color: red; display: flex; flex: 1 1 0%;"></div>'
  )

  app.state.foo = "tan"
  await app

  t.is(
    app.el.innerHTML,
    '<div style="color: tan; display: flex; flex: 1 1 0%;"></div>'
  )
})

/* update event
=============== */

test("update", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "{{a}}{{b}}{{c}}",
      state: { a: "a", b: "b", c: "c" },
    })
  )

  const stub = t.stub()

  app.reactive.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.state.a = "A"
  app.state.b = "B"
  delete app.state.c

  t.is(stub.count, 0)

  await app

  t.is(app.el.innerHTML, "AB")
  t.is(stub.count, 1)
  t.eq(stub.calls, [
    {
      args: [new Set(["/a", "/b", "/c"]), new Set(["/c"])],
    },
  ])

  t.is(app.reactive.throttle, true)
})

/* update throttle
==================
One update every animation frame */

test("update throttle", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "{{a}}{{b}}{{c}}",
      state: { a: "a", b: "b", c: "c" },
    })
  )

  t.is(app.reactive.throttle, true)

  const stub = t.stub()

  app.reactive.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.state.a = "A"
  app.state.b = "B"
  app.state.c = "C"

  t.is(stub.count, 0)

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 1)
  t.eq(stub.calls, [
    {
      args: [new Set(["/a", "/b", "/c"]), new Set()],
    },
  ])

  t.is(app.reactive.throttle, true)
})

test("update throttle", "using throttle:false", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "{{a}}{{b}}{{c}}",
      state: { a: "a", b: "b", c: "c" },
    })
  )

  app.reactive.throttle = false

  const stub = t.stub()

  app.reactive.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.state.a = "A"
  app.state.b = "B"
  app.state.c = "C"

  t.is(stub.count, 3)

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 3)
  t.eq(stub.calls, [
    { args: [new Set(["/a"]), new Set()] },
    { args: [new Set(["/b"]), new Set()] },
    { args: [new Set(["/c"]), new Set()] },
  ])

  t.is(app.reactive.throttle, false)
})

test("update throttle", "using updateNow", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "{{a}}{{b}}{{c}}",
      state: { a: "a", b: "b", c: "c" },
    })
  )

  t.is(app.reactive.throttle, true)

  const stub = t.stub()

  app.reactive.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.reactive.data.a = "A"
  app.reactive.data.b = "B"
  app.reactive.data.c = "C"
  app.reactive.updateNow("/a")
  app.reactive.updateNow("/b")
  app.reactive.updateNow("/c")

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 3)
  t.eq(stub.calls, [
    { args: [new Set(["/a"]), new Set()] },
    { args: [new Set(["/b"]), new Set()] },
    { args: [new Set(["/c"]), new Set()] },
  ])

  t.is(app.reactive.throttle, true)
})

test("update throttle", "using silent:true", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "{{a}}{{b}}{{c}}",
      state: { a: "a", b: "b", c: "c" },
    })
  )

  t.is(app.reactive.throttle, true)

  const stub = t.stub()

  app.reactive.on("update", stub)

  t.is(app.el.innerHTML, "abc")
  t.is(stub.count, 0)

  app.reactive.set("/a", "A", { silent: true })
  app.reactive.set("/b", "B", { silent: true })
  app.reactive.set("/c", "C", { silent: true })
  app.reactive.updateNow("/a")
  app.reactive.updateNow("/b")
  app.reactive.updateNow("/c")

  await app

  t.is(app.el.innerHTML, "ABC")
  t.is(stub.count, 3)
  t.eq(stub.calls, [
    { args: [new Set(["/a"]), new Set()] },
    { args: [new Set(["/b"]), new Set()] },
    { args: [new Set(["/c"]), new Set()] },
  ])

  t.is(app.reactive.throttle, true)
})

/* scope
======== */

test("scope", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      scope: "foo",
      content: "{{bar}}",
      state: {
        foo: { bar: "hi" },
      },
    })
  )

  t.eq(Object.keys(app.ctx.renderers), ["/foo/bar"])
  t.isProxy(app.state.foo)
  t.is(app.el.innerHTML, "<em>hi</em>")

  app.state.foo.bar = "bye"
  await app

  t.is(app.el.innerHTML, "<em>bye</em>")
})

test("scope", "relative scopes", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
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
      state: {
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
  )

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

  app.state.a.b.c.d = "#"
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
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
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
      state: {
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
  )

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

  app.state.a.b.c.d = "#"
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
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      class: "{{a}} {{b}}",
      state: {
        a: "x",
        b: "y",
      },
    })
  )

  t.is(app.el.innerHTML, '<em class="x y"></em>')

  app.state.a = "a"
  await app

  t.is(app.el.innerHTML, '<em class="a y"></em>')

  delete app.state.b
  await app

  t.is(app.el.innerHTML, '<em class="a "></em>')
})

test("class", "array", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      class: ["{{a}}", "{{b}}"],
      state: {
        a: "x",
        b: "y",
      },
    })
  )

  t.is(app.el.innerHTML, '<em class="x y"></em>')

  app.state.a = "a"
  await app

  t.is(app.el.innerHTML, '<em class="a y"></em>')

  delete app.state.b
  await app

  t.is(app.el.innerHTML, '<em class="a "></em>')
})

test("class", "object", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      class: { a: "{{a}}", b: "{{b}}" },
      state: {
        a: true,
        b: true,
      },
    })
  )

  t.is(app.el.innerHTML, '<em class="a b"></em>')

  app.state.a = false
  await app

  t.is(app.el.innerHTML, '<em class="b"></em>')

  app.state.b = undefined
  await app

  t.is(app.el.innerHTML, '<em class=""></em>')

  app.state.b = true
  await app

  t.is(app.el.innerHTML, '<em class="b"></em>')

  app.state.a = 1
  await app

  t.is(app.el.innerHTML, '<em class="b a"></em>')
})

/* abbreviations
================ */

test.tasks(
  [
    test.task({
      def: { tag: "span#foo.bar" },
      expected: '<span id="foo" class="bar"></span>',
    }),
    test.task({
      def: { tag: "span#foo.bar", id: "x" },
      expected: '<span id="x" class="bar"></span>',
    }),
    test.task({
      def: { tag: "span#foo.bar", class: "baz" },
      expected: '<span id="foo" class="baz bar"></span>',
    }),
  ],
  (test, { def, expected }) => {
    test("abbr", "expand", def, async (t) => {
      const app = await t.utils.decay(ui(t.utils.dest(), def))
      t.is(app.el.innerHTML, expected)
    })
  }
)

test("abbr", "reactive", async (t) => {
  const app = t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em#{{foo}}",
      state: {
        foo: "bar",
      },
    })
  )

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em id="bar"></em>')

  app.state.foo = "baz"
  await app

  t.is(app.el.innerHTML, '<em id="baz"></em>')
})

test("abbr", "reactive", 2, async (t) => {
  const app = t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em#{{foo}}.{{a}}.{{b}}",
      state: {
        foo: "bar",
        a: "x",
        b: "y",
      },
    })
  )

  t.is(app.el.innerHTML, "<em></em>")

  await app

  t.is(app.el.innerHTML, '<em id="bar" class="x y"></em>')

  app.state.foo = "baz"
  app.state.b = "z"
  await app

  t.is(app.el.innerHTML, '<em id="baz" class="x z"></em>')

  delete app.state.b
  await app

  t.is(app.el.innerHTML, '<em id="baz" class="x "></em>')

  delete app.state.foo
  await app

  t.is(app.el.innerHTML, '<em class="x "></em>')

  delete app.state.a
  await app

  t.is(app.el.innerHTML, '<em class=" "></em>')
})

/* actions
========== */

const uppercase = (str) => str.toUpperCase()

test("actions", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "a {{foo|>uppercase}}",
      state: { foo: "b" },
      actions: { uppercase },
    })
  )

  t.is(app.el.innerHTML, "a B")

  app.state.foo = "x"
  await app

  t.is(app.el.innerHTML, "a X")
})

test("actions", "error", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(true), {
      content: "a {{foo|>uppercase}}",
      state: { foo: "b" },
      actions: {
        uppercase() {
          throw new Error("boom")
        },
      },
    })
  )

  let e = await t.utils.when(document.body, "error")
  e.preventDefault()
  t.is(e.message, "boom")

  t.is(app.el.innerHTML, "a ")

  app.state.foo = "x"

  e = await t.utils.when(document.body, "error")
  e.preventDefault()
  t.is(e.message, "boom")

  await app
  t.is(app.el.innerHTML, "a ")
})

test("actions", "as function", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "a {{uppercase(foo)}}",
      state: { foo: "b" },
      actions: { uppercase },
    })
  )

  t.is(app.el.innerHTML, "a B")

  app.state.foo = "x"
  await app

  t.is(app.el.innerHTML, "a X")
})

test("actions", "inline variable", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "a {{'b'|>uppercase}}",
      actions: { uppercase },
    })
  )

  t.is(app.el.innerHTML, "a B")
})

test("actions", "inline variable", "as function", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "a {{uppercase('b')}}",
      actions: { uppercase },
    })
  )

  t.is(app.el.innerHTML, "a B")
})

test("actions", "buildin actions", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "pre",
      content: "{{foo|>stringify}}",
      state: { foo: { a: 1 } },
    })
  )

  t.is(
    app.el.innerHTML,
    `\
<pre>{
  a: 1,
}</pre>`
  )
})

test("actions", "thisArg", async (t) => {
  t.plan(3)
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: "a {{foo|>uppercase}}",
      state: { foo: "b" },
      actions: {
        uppercase(str) {
          t.is(this.el.localName, "em")
          t.eq(this.reactive.data, { foo: "b" })
          return str.toUpperCase()
        },
      },
    })
  )

  t.is(app.el.innerHTML, "<em>a B</em>")
})

test("actions", "nested action", async (t) => {
  t.plan(3)
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: "a {{foo|>foo.bar}}",
      state: { foo: "b" },
      actions: {
        foo: {
          bar(str) {
            t.is(this.el.localName, "em")
            t.eq(this.reactive.data, { foo: "b" })
            return str.toUpperCase()
          },
        },
      },
    })
  )

  t.is(app.el.innerHTML, "<em>a B</em>")
})

test("actions", "nested action", 2, async (t) => {
  t.plan(3)
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: "a {{foo.bar(foo)}}",
      state: { foo: "b" },
      actions: {
        foo: {
          bar(str) {
            t.is(this.el.localName, "em")
            t.eq(this.reactive.data, { foo: "b" })
            return str.toUpperCase()
          },
        },
      },
    })
  )

  t.is(app.el.innerHTML, "<em>a B</em>")
})

test("actions", "thisArg", "nested", async (t) => {
  t.plan(8)

  const tags = ["section", "em", "strong"]
  let cnt = 0

  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [
        "{{foo|>uppercase}}",
        { tag: "em", content: "{{foo|>uppercase}}" },
        { tag: "strong", content: "{{foo|>uppercase}}" },
      ],
      state: { foo: "b" },
      actions: {
        uppercase(str) {
          t.is(this.el.localName, tags[cnt++])
          return str.toUpperCase()
        },
      },
    })
  )

  t.is(app.el.innerHTML, "B<em>B</em><strong>B</strong>")

  cnt = 0
  app.state.foo = "x"
  await app

  t.is(app.el.innerHTML, "X<em>X</em><strong>X</strong>")
})

test("actions", "buildin actions locate", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "pre",
      content: "{{foo |> stringify('min')}}",
      // content: "{{foo|>stringify.min}}",
      state: { foo: { a: 1 } },
    })
  )

  t.is(app.el.innerHTML, "<pre>{a:1}</pre>")
})

test("actions", "pluralize", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "{{'apple'|>pluralize}}, {{'orange'|>pluralize(5)}}",
    })
  )

  t.is(app.el.innerHTML, "apples, oranges")
})

/* if
======= */

test("if", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { if: "{{a.b}}", content: "x" },
      state: {
        a: { b: false },
      },
    })
  )

  t.is(app.el.textContent, "")

  app.state.a.b = true
  await app

  t.is(app.el.textContent, "x")

  app.state.a.b = false
  await app

  t.is(app.el.textContent, "")
})

test("if", "manage renderers", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { if: "{{a.b}}", content: "{{x}}" },
      state: {
        a: { b: false },
        x: "y",
      },
    })
  )

  t.is(app.el.textContent, "")
  t.eq(Object.keys(app.ctx.renderers), [
    "/a/b", //
  ])

  app.state.a.b = true
  await app

  t.is(app.el.textContent, "y")
  t.eq(Object.keys(app.ctx.renderers), [
    "/a/b", //
    "/x", //
  ])

  app.state.a.b = false
  await app

  t.is(app.el.textContent, "")
  t.eq(Object.keys(app.ctx.renderers), [
    "/a/b", //
  ])
})

test("if", "array", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        content: [{ if: "{{0}}", content: "x" }],
      },
      state: {
        arr: [false],
      },
    })
  )

  t.is(app.el.textContent, "")

  app.state.arr[0] = true
  await app

  t.is(app.el.textContent, "x")

  app.state.arr[0] = false
  await app

  t.is(app.el.textContent, "")
})

test("if", "else", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [{ if: "{{a.b}}", content: "x", else: "y" }],
      state: {
        a: { b: true },
      },
    })
  )

  t.is(app.el.textContent, "x")

  app.state.a.b = false
  await app

  t.is(app.el.textContent, "y")

  app.state.a.b = true
  await app

  t.is(app.el.textContent, "x")
})

test("if", "else with empty content", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [{ if: "{{a.b}}", content: "x", else: [] }],
      state: {
        a: { b: true },
      },
    })
  )

  t.is(app.el.textContent, "x")

  app.state.a.b = false
  await app

  t.is(app.el.textContent, "")

  app.state.a.b = true
  await app

  t.is(app.el.textContent, "x")
})

test("if", "nodes", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [
        {
          if: "{{a.b}}",
          content: [
            "x", //
            { tag: "em", content: "y" },
          ],
        },
      ],
      state: {
        a: { b: false },
      },
    })
  )

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")

  app.state.a.b = true
  await app

  t.is(app.el.textContent, "xy")
  t.is(app.el.innerHTML, "<!--[if]-->x<em>y</em>")

  app.state.a.b = false
  await app

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")
})

test("if", "element", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
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
      state: {
        a: { b: false },
      },
    })
  )

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")

  app.state.a.b = true
  await app

  t.is(app.el.textContent, "xy")
  t.is(app.el.innerHTML, "<!--[if]--><div>x<em>y</em></div>")

  app.state.a.b = false
  await app

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[if]-->")
})

test("if", "bug using reactive.update", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [
        {
          tag: "div",
          if: "{{a && b}}",
          content: "{{b}}",
        },
      ],
      state: {
        a: false,
        b: false,
      },
    })
  )

  t.is(app.el.innerHTML, "<!--[if]-->")
  t.is(app.el.textContent, "")

  app.state.a = true
  await app

  t.is(app.el.textContent, "")

  app.state.b = true
  await app

  t.is(app.el.textContent, "true")

  app.ctx.reactive.update("/a")
  await app

  t.is(app.el.textContent, "true")

  app.state.a = false
  await app

  t.is(app.el.textContent, "")
})

/* data array
============= */

test("array", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "em",
      content: [
        "{{arr/0}}", //
        "{{arr/1}}",
      ],
      state: {
        arr: ["a", "b"],
      },
    })
  )

  t.is(app.el.innerHTML, "<em>ab</em>")

  app.state.arr.push("c")
  await app

  t.is(app.el.innerHTML, "<em>ab</em>")

  app.state.arr[0] = "A"
  await app

  t.is(app.el.innerHTML, "<em>Ab</em>")

  app.state.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<em>A</em>")
})

/* each
========= */

test("each", "manage childNodes", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{.}}" },
    })
  )

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[each]-->")

  app.state.arr = [1, 2, 3]
  await app

  t.is(app.el.textContent, "123")
  const childNodes = [...app.el.childNodes]
  t.is(childNodes[1].textContent, "1")

  app.state.arr.push(4)
  await app

  t.is(app.el.textContent, "1234")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])
  t.is(childNodes[3], app.el.childNodes[3])

  app.state.arr.length = 2
  await app

  t.is(app.el.textContent, "12")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.state.arr[0] = "a"
  await app

  t.is(app.el.textContent, "a2")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.state.arr[1] = "b"
  await app

  t.is(app.el.textContent, "ab")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.state.arr.length = 0
  await app
  t.is(app.el.textContent, "")
})

test("each", "manage renderers", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: { tag: "em", content: "{{.}}" },
      },
      state: {
        arr: ["a", "b", "c", "d"],
      },
    })
  )

  t.is(app.el.textContent, "abcd")
  t.eq(Object.keys(app.ctx.renderers), [
    "/arr", //
    "/arr/0",
    "/arr/1",
    "/arr/2",
    "/arr/3",
  ])

  app.state.arr.splice(2, 1)
  await app

  t.is(app.el.textContent, "abd")
  t.eq(Object.keys(app.ctx.renderers), [
    "/arr", //
    "/arr/0",
    "/arr/1",
    "/arr/2",
  ])

  app.state.arr.length = 1
  await app

  t.is(app.el.textContent, "a")
  t.eq(Object.keys(app.ctx.renderers), [
    "/arr", //
    "/arr/0",
  ])

  app.state.arr.push("x")
  await app

  t.is(app.el.textContent, "ax")
  t.eq(Object.keys(app.ctx.renderers), [
    "/arr", //
    "/arr/0",
    "/arr/1",
  ])

  app.state.arr.length = 0
  await app

  t.is(app.el.textContent, "")
  t.eq(Object.keys(app.ctx.renderers), [
    "/arr", //
  ])
})

test("each", "def", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: {
          tag: "span",
          content: "{{.}}",
        },
      },
      state: { arr: ["a", "b"] },
    })
  )

  t.is(app.el.textContent, "ab")
  t.is(
    app.el.innerHTML,
    "<!--[each]--><span>a</span><!--[#]--><span>b</span><!--[#]-->"
  )

  app.state.arr.push("c")
  await app

  t.is(app.el.textContent, "abc")
  t.is(
    app.el.innerHTML,
    "<!--[each]--><span>a</span><!--[#]--><span>b</span><!--[#]--><span>c</span><!--[#]-->"
  )

  app.state.arr.length = 1
  await app

  t.is(app.el.textContent, "a")
  t.is(app.el.innerHTML, "<!--[each]--><span>a</span><!--[#]-->")

  app.state.arr.length = 0
  await app

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[each]-->")

  app.state.arr.push("x")
  await app

  t.is(app.el.textContent, "x")
  t.is(app.el.innerHTML, "<!--[each]--><span>x</span><!--[#]-->")
})

test("each", "splice", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{.}}" },
    })
  )

  app.state.arr = [1, 2, 3]
  await app

  t.is(app.el.textContent, "123")

  app.state.arr.splice(1, 1)
  await app

  t.is(app.el.textContent, "13")
})

test("each", "array with objects", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: {
          tag: "span",
          content: "{{x}}",
          class: "{{y}}",
        },
      },
      state: {
        arr: [
          { x: "A", y: "1" },
          { x: "B", y: "2" },
        ],
      },
    })
  )

  t.is(
    app.el.innerHTML,
    '<!--[each]--><span class="1">A</span><!--[#]--><span class="2">B</span><!--[#]-->'
  )

  app.state.arr[0].x = "foo"
  await app
  t.is(
    app.el.innerHTML,
    '<!--[each]--><span class="1">foo</span><!--[#]--><span class="2">B</span><!--[#]-->'
  )

  app.state.arr = [{ x: "Z", y: "9" }]
  await app
  t.is(app.el.innerHTML, '<!--[each]--><span class="9">Z</span><!--[#]-->')
})

test("each", "render index 0 bug", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: {
          tag: "div",
          content: "{{path}}",
        },
      },
      state: {
        arr: [{ path: "A" }],
      },
    })
  )

  await app

  t.is(app.el.children.length, 1)
  t.is(app.el.textContent, "A")

  app.state.arr = [{ path: "Z" }]
  await app

  t.is(app.el.children.length, 1)
  t.is(app.el.textContent, "Z")
  t.is(app.el.innerHTML, "<!--[each]--><div>Z</div><!--[#]-->")

  app.state.arr = [{ path: "X" }, { path: "Y" }]
  await app

  t.is(
    app.el.innerHTML,
    "<!--[each]--><div>X</div><!--[#]--><div>Y</div><!--[#]-->"
  )
  t.is(app.el.children.length, 2)
  t.is(app.el.textContent, "XY")
})

test("each", "innerHTML", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [
        {
          scope: "arr",
          tag: "ul",
          each: { tag: "li", content: "{{.}}" },
        },
      ],
      state: { arr: [1, 2, 3] },
    })
  )

  t.is(app.el.textContent, "123")
  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>1</li><!--[#]--><li>2</li><!--[#]--><li>3</li><!--[#]--></ul>"
  )

  app.state.arr.push(4)
  await app

  t.is(app.el.textContent, "1234")
  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>1</li><!--[#]--><li>2</li><!--[#]--><li>3</li><!--[#]--><li>4</li><!--[#]--></ul>"
  )

  app.state.arr.length = 2
  await app

  t.is(app.el.textContent, "12")
  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>1</li><!--[#]--><li>2</li><!--[#]--></ul>"
  )
})

test("each", "element", "scopped", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ul",
        scope: "a.b",
        each: { tag: "li", content: "{{.}}" },
      },
      state: { a: { b: ["foo", "bar"] } },
    })
  )

  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>foo</li><!--[#]--><li>bar</li><!--[#]--></ul>"
  )

  app.state.a.b.push("baz")
  await app

  t.is(
    app.el.innerHTML,
    "<ul><!--[each]--><li>foo</li><!--[#]--><li>bar</li><!--[#]--><li>baz</li><!--[#]--></ul>"
  )

  app.state.a.b.length = 0
  // app.state.a.b = []
  await app

  t.is(app.el.innerHTML, "<ul><!--[each]--></ul>")
})

test("each", "array of objects", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{a}} - {{b}} - " },
      state: {
        arr: [
          { a: 1, b: 2 },
          { a: 3, b: 4 },
        ],
      },
    })
  )

  t.is(app.el.textContent, "1 - 2 - 3 - 4 - ")
})

test("each", "array of objects", "scopped", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{a}} - {{b}} - " },
      state: {
        arr: [
          { a: 1, b: 2 },
          { a: 3, b: 4 },
        ],
      },
    })
  )

  t.is(app.el.innerHTML, "<!--[each]-->1 - 2 - <!--[#]-->3 - 4 - <!--[#]-->")
  t.is(app.el.textContent, "1 - 2 - 3 - 4 - ")

  app.state.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<!--[each]-->1 - 2 - <!--[#]-->")
  t.is(app.el.textContent, "1 - 2 - ")

  app.state.arr = undefined
  await app

  t.is(app.el.innerHTML, "<!--[each]-->")
  t.is(app.el.textContent, "")

  app.state.arr = [{ a: "a", b: "b" }]
  await app

  t.is(app.el.textContent, "a - b - ")

  app.state.arr[0].a = "x"
  delete app.state.arr[0].b
  await app

  t.is(app.el.textContent, "x -  - ")

  delete app.state.arr
  await app

  t.is(app.el.textContent, "")
})

test("each", "access root data", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{a}} {{/foo}} " },
      state: {
        foo: "bar",
        arr: [{ a: 1 }, { a: 2 }],
      },
    })
  )

  t.is(app.el.textContent, "1 bar 2 bar ")
})

test("each", "access data in previous level", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "baz/arr",
        each: "{{a}} {{foo ?? ../../foo}} {{/x}} {{../../hello}} - ",
      },
      state: {
        foo: "bar",
        x: "y",
        baz: {
          foo: "baz",
          hello: "world",
          arr: [{ a: 1, foo: "derp" }, { a: 2 }],
        },
      },
    })
  )

  t.is(app.el.textContent, "1 derp y world - 2 baz y world - ")
})

test("each", "lastChild bug", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        content: [{ each: [{ content: "{{a}}" }] }, { content: "z" }],
      },
      state: {
        arr: [{ a: "x" }, { a: "y" }],
      },
    })
  )

  t.is(app.el.innerHTML, "<!--[each]-->x<!--[#]-->y<!--[#]-->z")

  app.state.arr.push({ a: "a" })
  await app

  t.is(app.el.innerHTML, "<!--[each]-->x<!--[#]-->y<!--[#]-->a<!--[#]-->z")

  app.state.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<!--[each]-->x<!--[#]-->z")

  delete app.state.arr
  await app

  t.is(app.el.innerHTML, "<!--[each]-->z")
})

test("each", "range bug", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        content: [
          { each: "{{a}}" }, //
          { content: "+" },
          { each: "{{a}}" },
        ],
      },

      state: {
        arr: [{ a: 1 }, { a: 2 }],
      },
    })
  )

  t.is(
    app.el.innerHTML,
    "<!--[each]-->1<!--[#]-->2<!--[#]-->+<!--[each]-->1<!--[#]-->2<!--[#]-->"
  )

  app.state.arr.push({ a: 3 })
  await app

  t.is(
    app.el.innerHTML,
    "<!--[each]-->1<!--[#]-->2<!--[#]-->3<!--[#]-->+<!--[each]-->1<!--[#]-->2<!--[#]-->3<!--[#]-->"
  )

  app.state.arr.length = 1
  await app

  t.is(app.el.innerHTML, "<!--[each]-->1<!--[#]-->+<!--[each]-->1<!--[#]-->")
})

test("each", "relative paths", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "baz/arr",
        each: "{{a}} {{foo ?? ../../foo}} {{../../foo}} {{/foo}} - ",
      },
      state: {
        foo: "bar",
        baz: {
          foo: "baz",
          arr: [{ a: 1, foo: "derp" }, { a: 2 }],
        },
      },
    })
  )

  t.is(app.el.textContent, "1 derp baz bar - 2 baz baz bar - ")
})

test("each", "@index", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{@index}} {{a}} " },
      state: {
        foo: "bar",
        arr: [{ a: "x" }, { a: "y" }],
      },
    })
  )

  t.is(app.el.textContent, "0 x 1 y ")
})

test("each", "@index", "string array", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{@index}} {{.}} " },
      state: {
        foo: "bar",
        arr: ["x", "y"],
      },
    })
  )

  t.is(app.el.textContent, "0 x 1 y ")
})

test("each", "#", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: ["{{#}} {{a}}\n", "{{##}} {{a}}\n", "{{###}} {{a}}\n"],
      },
      state: {
        foo: "bar",
        arr: [{ a: "x" }, { a: "y" }],
      },
    })
  )

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
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: ["{{#}} {{.}}\n", "{{##}} {{.}}\n", "{{###}} {{.}}\n"],
      },
      state: {
        foo: "bar",
        arr: ["x", "y"],
      },
    })
  )

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
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{##}}:{{a}}{{@last ? '' : ', '}}" },
      state: {
        foo: "bar",
        arr: [{ a: "x" }, { a: "y" }],
      },
    })
  )

  t.is(app.el.textContent, "00:x, 01:y")
})

test("each", "@first", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { scope: "arr", each: "{{@first ? ' - ' : ''}}{{##}}:{{a}} " },
      state: {
        foo: "bar",
        arr: [{ a: "x" }, { a: "y" }, { a: "z" }],
      },
    })
  )

  t.is(app.el.textContent, " - 00:x 01:y 02:z ")
})

test("each", "@last element", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: ["{{@index}} {{a}}", { tag: "br", if: "{{!@last}}" }],
      },
      state: {
        foo: "bar",
        arr: [{ a: "x" }, { a: "y" }],
      },
    })
  )

  t.is(
    app.el.innerHTML,
    "<!--[each]-->0 x<!--[if]--><br><!--[#]-->1 y<!--[if]--><!--[#]-->"
  )
})

test("each", "@first element", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: [{ tag: "hr", if: "{{!@last}}" }, "{{@index}} {{a}}"],
      },
      state: {
        foo: "bar",
        arr: [{ a: "x" }, { a: "y" }],
      },
    })
  )

  t.is(
    app.el.innerHTML,
    "<!--[each]--><!--[if]--><hr>0 x<!--[#]--><!--[if]-->1 y<!--[#]-->"
  )
})

test("each", "input element", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "arr",
        each: [{ tag: "textarea", scope: "a" }],
      },
      state: {
        arr: [{ a: "x" }, { a: "y" }],
      },
    })
  )

  let ta = app.el.querySelectorAll("textarea")
  t.is(ta.length, 2)
  t.is(ta[0].name, "/arr/0/a")
  t.is(ta[0].value, "x")
  t.is(ta[1].name, "/arr/1/a")
  t.is(ta[1].value, "y")

  // app.state.arr.pop()
  app.state.arr = [{ a: "z" }]
  await app

  ta = app.el.querySelectorAll("textarea")
  t.is(ta.length, 1)
  t.is(ta[0].name, "/arr/0/a")
  t.is(ta[0].value, "z")
})

/* computed
=========== */

test("computed", async (t) => {
  t.plan(6)

  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "parsed",
        content: "foo: {{0}}, bar: {{1}}",
      },

      state: {
        formated: "FOO/BAR",
      },

      computed: {
        parsed: "{{formated|>split('/')}}",
      },
    })
  )

  const updates = ["/formated", "/parsed"]
  app.reactive.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  t.eq(app.state.parsed, ["FOO", "BAR"])
  t.eq(app.reactive.data, {
    formated: "FOO/BAR",
  })

  t.is(app.el.innerHTML, "foo: FOO, bar: BAR")

  app.state.formated = "HELLO/WORLD"
  await app

  t.is(app.el.innerHTML, "foo: HELLO, bar: WORLD")
})

/* actions
========== */

test("on", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "button",
        content: "cnt: {{cnt}}",
        on: { click: "{{cnt++}}" },
      },

      state: {
        cnt: 42,
      },
    })
  )

  t.eq(app.state, { cnt: 42 })

  const el = app.el.querySelector("button")

  el.click()
  t.eq(app.state, { cnt: 42 })
  await app
  t.eq(app.state, { cnt: 43 })
})

test("on", "queued fast calls", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "button",
        content: "cnt: {{cnt}}",
        on: { click: "{{cnt++}}" },
      },

      state: {
        cnt: 42,
      },
    })
  )

  t.eq(app.state, { cnt: 42 })

  const el = app.el.querySelector("button")

  el.click()
  el.click()
  el.click()
  el.click()
  t.eq(app.state, { cnt: 42 })
  await app
  t.eq(app.state, { cnt: 46 })
})

test("on", "actions", async (t) => {
  t.plan(4)
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "button",
        content: "cnt: {{cnt}}",
        on: { click: "{{incr(10, e)}}" },
      },

      state: {
        cnt: 42,
      },

      actions: {
        incr(n, e) {
          t.instanceOf(e, Event)
          this.state.cnt += n
        },
      },
    })
  )

  t.eq(app.state, { cnt: 42 })

  const el = app.el.querySelector("button")

  el.click()
  t.eq(app.state, { cnt: 42 })
  await app
  t.eq(app.state, { cnt: 52 })

  app.destroy()
  el.click()
  await app
})

/* fields
========= */

function change(input, value) {
  input.value = value
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

test("input", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "input",
        scope: "str",
      },

      state: {
        str: "foo",
      },
    })
  )

  t.eq(
    test.utils.prettify(app.el.innerHTML),
    `\
<label for="a59j5pfmedwe">Str</label>
<input name="/str" id="a59j5pfmedwe" autocomplete="off">`
    //     `\
    // <fieldset role="none">
    //   <label for="a59j5pfmedwe">Str</label>
    //   <input name="/str" id="a59j5pfmedwe">
    // </fieldset>`
  )

  const input = app.el.querySelector("input")
  t.eq(input.value, "foo")

  change(input, "bar")
  await app

  t.eq(app.data.str, "bar")

  app.state.str = "baz"
  await app

  t.eq(input.value, "baz")
})
