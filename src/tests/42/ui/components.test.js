import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/class/Component.js"

test.suite.timeout(1000)

const tmp = test.utils.container({ id: "component-tests" })

Component.define({
  tag: "ui-t-props",
  props: {
    bar: 2,
  },
  content: "foo: {{foo}}, bar: {{bar}}",
})

async function checkDefine(component, t, args, expected) {
  const fn = await (typeof component === "object" ||
  /^\s*class/.test(component.toString())
    ? Component.define(component)
    : Component.define(component(t)))

  if (args) {
    const el = fn(...args)
    if (expected) {
      t.is(el.outerHTML, expected)
    }
  }
}

const { task } = test

test.tasks(
  [
    task({
      component: class extends Component {
        static definition = { tag: "ui-t-basic" }
      },
      html: "<ui-t-basic></ui-t-basic>",
      def: { tag: "ui-t-basic" },
      expected: "<ui-t-basic></ui-t-basic>",
    }),

    task({
      component: class extends Component {
        static definition = { tag: "ui-t-string" }
        render() {
          return "hello"
        }
      },
      html: "<ui-t-string></ui-t-string>",
      def: { tag: "ui-t-string" },
      expected: "<ui-t-string>hello</ui-t-string>",
    }),

    task({
      component: class extends Component {
        static definition = { tag: "ui-t-attr", class: "derp" }
        render() {
          return "hello"
        }
      },
      def: { tag: "ui-t-attr" },
      expected: '<ui-t-attr class="derp">hello</ui-t-attr>',
    }),

    task({
      component: {
        tag: "ui-t-data",
        content: "foo: {{foo}}",
      },
      def: {
        content: { tag: "ui-t-data" },
        state: { foo: 1 },
      },
      expected: "<ui-t-data>foo: 1</ui-t-data>",
    }),

    task({
      component: {
        tag: "ui-t-dynamic",
        props: {
          x: {
            type: "string",
          },
        },
        content: "x:{{x}}",
      },
      def: {
        content: {
          tag: "ui-t-dynamic",
          x: "{{foo}}",
        },
        state: { foo: "bar" },
      },
      expected: "<ui-t-dynamic>x:bar</ui-t-dynamic>",
    }),

    task({
      title: "lifecycle",
      connect: true,
      component(t) {
        t.plan(9)
        const stub = t.stub()
        const reasons = [
          "ui-t-signal destroyed", //
          "ui destroyed",
        ]
        return class extends Component {
          static definition = {
            tag: "ui-t-signal",

            props: {
              foo: "bar",
            },
          }

          setup({ signal }) {
            signal.addEventListener("abort", () => {
              const expected = reasons.shift()
              t.is(signal.reason, expected)
            })
            this.addEventListener("click", stub, { signal })
          }
        }
      },
      def: {
        content: { tag: "ui-t-signal" },
      },
      async check(t, app) {
        const el = app.query("ui-t-signal")
        const [stub] = t.stubs
        t.is(stub.count, 0)

        el.click()
        t.is(stub.count, 1)

        el.recycle()
        app.el.append(el)

        el.click()
        t.is(stub.count, 2)

        el.remove()
        el.click()
        t.is(stub.count, 2)

        await el.init({}, app.ctx)
        app.el.append(el)
        await el.ready
        el.click()
        t.is(stub.count, 3)

        el.click()
        t.is(stub.count, 4)

        app.destroy()
        el.click()
        t.is(stub.count, 4)
      },
    }),

    task({
      def: {
        content: { tag: "ui-t-props", bar: 0 },
        state: { foo: 1 },
      },
      expected: '<ui-t-props bar="0">foo: 1, bar: 0</ui-t-props>',
    }),

    task({
      def: {
        content: { tag: "ui-t-props" },
        state: { foo: 1 },
      },
      expected: '<ui-t-props bar="2">foo: 1, bar: 2</ui-t-props>',
      async check(t, app) {
        const el = app.query("ui-t-props")

        t.is(el.bar, 2)

        el.bar = 3
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="3">foo: 1, bar: 3</ui-t-props>'
        )

        el.bar = 4
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="4">foo: 1, bar: 4</ui-t-props>'
        )

        el.setAttribute("bar", "5")
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="5">foo: 1, bar: 5</ui-t-props>'
        )
      },
    }),

    task({
      component: {
        tag: "ui-t-props-state",
        props: {
          bar: {
            type: "number",
            default: 2,
            state: true,
            reflect: true,
          },
        },
        content: "foo: {{foo}}, bar: {{bar}}",
      },
      def: {
        content: { tag: "ui-t-props-state" },
        state: { foo: 1 },
      },
      expected: '<ui-t-props-state bar="2">foo: 1, bar: 2</ui-t-props-state>',
      async check(t, app) {
        const el = app.query("ui-t-props-state")

        t.is(app.reactive.get("bar"), 2)
        t.is(el.bar, 2)

        app.reactive.set("bar", 3)
        await app

        t.is(el.bar, 3)
        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="3">foo: 1, bar: 3</ui-t-props-state>'
        )

        el.bar = 4
        t.is(app.reactive.get("bar"), 4)
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="4">foo: 1, bar: 4</ui-t-props-state>'
        )

        el.setAttribute("bar", "5")
        t.is(app.reactive.get("bar"), 5)
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="5">foo: 1, bar: 5</ui-t-props-state>'
        )
      },
    }),

    task({
      component(t) {
        t.plan(2)
        return class extends Component {
          static definition = {
            tag: "ui-t-filter",
            props: {
              bar: 2,
            },
            content: "foo: {{/foo |> add5}}, bar: {{bar |> add10}}",
          }

          add5(val) {
            return val + 5
          }

          add10(val) {
            t.is(val, 2)
            return val + 10
          }
        }
      },
      def: {
        content: { tag: "ui-t-filter" },
        state: { foo: 1 },
      },
      expected: '<ui-t-filter bar="2">foo: 6, bar: 12</ui-t-filter>',
    }),

    task({
      component: {
        tag: "ui-t-ready",
        content: "ext: {{/foo |> extname}}",
      },
      def: {
        content: { tag: "ui-t-ready" },
        state: { foo: "/42/index.html" },
      },
      expected: "<ui-t-ready>ext: .html</ui-t-ready>",
    }),

    task({
      component: {
        tag: "ui-t-noprops",
        content: "foo: {{foo}}",
        props: {
          foo: {
            type: "string",
            reflect: true,
          },
        },
      },
      def: {
        content: { tag: "ui-t-noprops" },
      },
      expected: "<ui-t-noprops>foo: </ui-t-noprops>",
    }),

    task({
      component: {
        tag: "ui-t-css",
        props: {
          foo: {
            type: "string",
            css: true,
          },
        },
      },
      def: {
        content: { tag: "ui-t-css" /* , foo: "red" */ },
      },
      expected: "<ui-t-css></ui-t-css>",
      async check(t, app) {
        const el = app.el.firstChild
        el.foo = "red"
        await app

        t.is(app.el.innerHTML, '<ui-t-css style="--foo:red;"></ui-t-css>')

        el.foo = undefined
        await app

        t.is(app.el.innerHTML, '<ui-t-css style=""></ui-t-css>')

        el.foo = "blue"
        await app

        t.is(app.el.innerHTML, '<ui-t-css style="--foo:blue;"></ui-t-css>')

        el.foo = undefined
        await app

        t.is(app.el.innerHTML, '<ui-t-css style=""></ui-t-css>')
      },
    }),

    task({
      component: {
        tag: "ui-t-css-state",
        props: {
          foo: {
            type: "string",
            css: true,
            state: true,
          },
        },
      },
      def: {
        content: { tag: "ui-t-css-state" /* , foo: "red" */ },
      },
      expected: "<ui-t-css-state></ui-t-css-state>",
      async check(t, app) {
        app.reactive.set("foo", "red")
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css-state style="--foo:red;"></ui-t-css-state>'
        )

        app.reactive.set("foo", undefined)
        await app

        t.is(app.el.innerHTML, '<ui-t-css-state style=""></ui-t-css-state>')

        app.reactive.set("foo", "blue")
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css-state style="--foo:blue;"></ui-t-css-state>'
        )

        app.reactive.delete("foo")
        await app

        t.is(app.el.innerHTML, '<ui-t-css-state style=""></ui-t-css-state>')
      },
    }),

    task({
      title: "update throttle bug",
      defer: true,
      component(t) {
        t.plan(2)
        return class extends Component {
          static definition = {
            tag: "ui-t-throttle",
            props: {
              path: {
                type: "string",
                reflect: true,
              },
            },
            content: "hello {{customFilter(path)}}",
          }

          customFilter(path) {
            t.is(path, "world")
            return path.toUpperCase()
          }
        }
      },
      def: {
        content: { tag: "ui-t-throttle", path: "world" },
      },
      expected: '<ui-t-throttle path="world">hello WORLD</ui-t-throttle>',
    }),
  ],

  (
    test,
    { title, defer, connect, component, args, html, def, check, expected }
  ) => {
    test(title ?? expected ?? def, async (t) => {
      if (component) {
        if (defer) {
          defer = t
            .sleep(20)
            .then(() => checkDefine(component, t, args, expected))
        } else await checkDefine(component, t, args, expected)
      }

      const app = await ui(tmp(connect), def)

      if (expected) t.is(app.el.innerHTML, expected, "ui declaration error")
      if (check) await check(t, app)

      if (html) {
        const el = tmp(connect)
        el.innerHTML = html
        await el.firstChild.ready
        t.is(el.innerHTML, expected, "html declaration error")
      }

      if (defer) {
        await Promise.all([defer, t.sleep(0)])
      }
    })
  }
)

test("component child", async (t) => {
  const app = await ui(tmp(true), {
    content: {
      tag: "ui-t-props",
      bar: 4,
      content: {
        tag: "em",
        content: "derp:{{derp}}, bar:{{bar}}",
      },
    },
    state: { derp: 5 },
  })

  t.eq(app.reactive.data, {
    "derp": 5,
    "ui-t-props": { 0: { bar: 4 } },
  })

  t.is(
    app.el.innerHTML,
    '<ui-t-props bar="4"><em>derp:5, bar:4</em></ui-t-props>'
  )
})

/* State
======== */

Component.define({
  tag: "ui-t-state",

  props: {
    x: {
      type: "string",
    },
  },

  content: "x:{{x}}-",
})

Component.define({
  tag: "ui-t-nested-fixed",

  props: {
    list: {
      type: "array",
    },
  },

  content: {
    scope: "list",
    each: {
      tag: "ui-t-state",
      x: "fixed",
    },
  },
})

test("state", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-state",
      x: "foo",
    },
  })

  t.is(app.el.textContent, "x:foo-")
  t.eq(app.reactive.data, {
    "ui-t-state": {
      0: { x: "foo" },
    },
  })
})

test("state", "template", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-state",
      x: "{{y}}",
    },

    state: {
      y: "foo",
    },
  })

  t.eq(app.reactive.data, {
    "y": "foo",
    "ui-t-state": {
      0: { x: { $ref: "/y" } },
    },
  })
  t.is(app.el.textContent, "x:foo-")

  app.state.y = "bar"
  await app

  t.is(app.el.textContent, "x:bar-")
})

test("state", "template", "not a ref", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-state",
      x: "prefix -> {{y}}",
    },

    state: {
      y: "foo",
    },
  })

  t.eq(app.reactive.data, {
    "y": "foo",
    "ui-t-state": { 0: { x: "prefix -> foo" } },
  })
  t.is(app.el.textContent, "x:prefix -> foo-")

  app.state.y = "bar"
  await app

  t.is(app.el.textContent, "x:prefix -> bar-")
})

test("state", "multiple", async (t) => {
  const app = await ui(tmp(), {
    content: [
      {
        tag: "ui-t-state",
        x: "foo",
      },
      {
        tag: "ui-t-state",
        x: "bar",
      },
    ],
  })

  t.is(app.el.textContent, "x:foo-x:bar-")
  t.eq(app.reactive.data, {
    "ui-t-state": {
      0: { x: "foo" },
      1: { x: "bar" },
    },
  })
})

test("state", "scopped", async (t) => {
  const app = await ui(tmp(), {
    scope: "a",
    content: [
      {
        tag: "ui-t-state",
        x: "foo",
      },
      {
        tag: "ui-t-state",
        x: "bar",
      },
    ],
  })

  t.is(app.el.textContent, "x:foo-x:bar-")
  t.eq(app.reactive.data, {
    "ui-t-state": {
      0: { x: "foo" },
      1: { x: "bar" },
    },
  })
})

test("state", "fixed", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-nested-fixed",
      list: [
        { foo: "a" }, //
        { foo: "b" },
      ],
    },
  })

  t.is(app.el.textContent, "x:fixed-x:fixed-")
  t.eq(app.reactive.data, {
    "ui-t-nested-fixed": { 0: { list: [{ foo: "a" }, { foo: "b" }] } },
    "ui-t-state": { 0: { x: "fixed" }, 1: { x: "fixed" } },
  })
})

/* nested
========= */

Component.define({
  tag: "ui-t-nested-dynamic",

  props: {
    list: {
      type: "array",
    },
  },

  content: {
    scope: "list",
    each: {
      tag: "ui-t-state",
      x: "{{foo}}",
    },
  },
})

test("state", "dynamic", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-nested-dynamic",
      list: [
        { foo: "a" }, //
      ],
    },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/ui-t-nested-dynamic/0/list",
    "/ui-t-nested-dynamic/0/list/0/foo",
  ])

  t.eq(app.reactive.data, {
    "ui-t-nested-dynamic": { 0: { list: [{ foo: "a" }] } },
    "ui-t-state": {
      0: { x: { $ref: "/ui-t-nested-dynamic/0/list/0/foo" } },
    },
  })
})

test("state", "dynamic", 2, async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-nested-dynamic",
      list: [
        { foo: "a" }, //
        { foo: "b" },
      ],
    },
  })

  t.eq(app.reactive.data, {
    "ui-t-nested-dynamic": { 0: { list: [{ foo: "a" }, { foo: "b" }] } },
    "ui-t-state": {
      0: { x: { $ref: "/ui-t-nested-dynamic/0/list/0/foo" } },
      1: { x: { $ref: "/ui-t-nested-dynamic/0/list/1/foo" } },
    },
  })
  t.is(app.el.textContent, "x:a-x:b-")

  const el = app.query("ui-t-nested-dynamic")

  el.list.push({ foo: "c" })
  await app

  t.is(app.el.textContent, "x:a-x:b-x:c-")

  el.list = [{ foo: "A" }]
  await app

  t.is(app.el.textContent, "x:A-")

  el.list.push({ foo: "B" })
  await app

  t.is(app.el.textContent, "x:A-x:B-")

  el.list[0] = { foo: "foo" }
  await app

  t.is(app.el.textContent, "x:foo-x:B-")
})

/* props
======== */

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

/* props state
============== */

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

/* array
======== */

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

/* string array
=============== */

Component.define({
  tag: "ui-t-nested-string-array",

  props: {
    list: {
      type: "array",
    },
  },

  content: {
    scope: "list",
    each: {
      tag: "ui-t-state",
      x: "{{.}}",
    },
  },
})

async function testStringArray(t, app) {
  t.is(app.el.textContent, "x:a-x:b-")

  app.state.arr = ["A"]
  await app

  t.is(app.el.textContent, "x:A-")

  app.state.arr.push("B")
  await app

  t.is(app.el.textContent, "x:A-x:B-")

  app.state.arr[0] = "foo"
  await app

  t.is(app.el.textContent, "x:foo-x:B-")
}

test("string array", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: {
        tag: "ui-t-state",
        x: "{{.}}",
      },
    },

    state: {
      arr: ["a", "b"],
    },
  })

  await testStringArray(t, app)
})

async function testStringArrayWithTransfers(t, app) {
  t.eq(app.reactive.data, {
    "arr": ["a", "b"],
    "ui-t-nested-string-array": { 0: { list: { $ref: "/arr" } } },
    "ui-t-state": {
      0: { x: { $ref: "/arr/0" } },
      1: { x: { $ref: "/arr/1" } },
    },
  })

  await testStringArray(t, app)

  t.eq(app.reactive.data, {
    "arr": ["foo", "B"],
    "ui-t-nested-string-array": { 0: { list: { $ref: "/arr" } } },
    "ui-t-state": {
      0: { x: { $ref: "/arr/0" } },
      1: { x: { $ref: "/arr/1" } },
    },
  })

  app.query("ui-t-nested-string-array").destroy()

  t.eq(app.reactive.data, {
    "arr": ["foo", "B"],
    "ui-t-nested-string-array": {},
    "ui-t-state": {},
  })
}

test("string array", "using transfers", async (t) => {
  const app = await ui(tmp(true), {
    content: {
      tag: "ui-t-nested-string-array",
      list: "{{arr}}",
    },

    state: {
      arr: ["a", "b"],
    },
  })

  await testStringArrayWithTransfers(t, app)
})

test("string array", "using transfers and async state", async (t) => {
  const app = await ui(tmp(true), {
    content: {
      tag: "ui-t-nested-string-array",
      list: "{{arr}}",
    },

    async state() {
      await t.sleep(100)
      return {
        arr: ["a", "b"],
      }
    },
  })

  await testStringArrayWithTransfers(t, app)
})

/* computed
=========== */

test("computed", async (t) => {
  t.plan(9)
  let cnt = 0

  await Component.define(
    class extends Component {
      static definition = {
        tag: "ui-t-computed",

        props: {
          formated: {
            type: "string",
          },
        },

        computed: {
          parsed: "{{formated |> split('/')}}",
        },

        content: {
          scope: "parsed",
          content: "foo: {{0}}, bar: {{1}}",
        },
      }

      split(formated, sep) {
        cnt++
        return formated.split(sep)
      }
    }
  )

  const app = await ui(tmp(true), {
    content: {
      tag: "ui-t-computed",
      formated: "FOO/BAR",
    },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/ui-t-computed/0/formated",
    "/ui-t-computed/0/parsed/0",
    "/ui-t-computed/0/parsed/1",
  ])
  t.is(cnt, 1)
  t.eq(app.reactive.data, {
    "ui-t-computed": { 0: { formated: "FOO/BAR" } },
  })
  t.is(app.el.innerHTML, "<ui-t-computed>foo: FOO, bar: BAR</ui-t-computed>")

  const updates = ["/ui-t-computed/0/formated", "/ui-t-computed/0/parsed"]
  app.reactive.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  app.query("ui-t-computed").formated = "HELLO/WORLD"
  await app

  t.is(
    app.el.innerHTML,
    "<ui-t-computed>foo: HELLO, bar: WORLD</ui-t-computed>"
  )
  t.is(cnt, 2)
  t.eq(app.reactive.data, {
    "ui-t-computed": { 0: { formated: "HELLO/WORLD" } },
  })
})

test("computed", "from prop with state:true", async (t) => {
  t.plan(9)
  let cnt = 0

  await Component.define(
    class extends Component {
      static definition = {
        tag: "ui-t-compu-sta",

        props: {
          formated: {
            type: "string",
            state: true,
          },
        },

        computed: {
          parsed: "{{formated |> split('/')}}",
        },

        content: {
          scope: "parsed",
          content: "foo: {{0}}, bar: {{1}}",
        },
      }

      split(formated, sep) {
        cnt++
        return formated.split(sep)
      }
    }
  )

  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-compu-sta",
      formated: "FOO/BAR",
    },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/formated",
    "/ui-t-compu-sta/0/parsed/0",
    "/ui-t-compu-sta/0/parsed/1",
  ])
  t.is(cnt, 1)
  t.eq(app.reactive.data, {
    "ui-t-compu-sta": { 0: {} },
    "formated": "FOO/BAR",
  })
  t.is(app.el.innerHTML, "<ui-t-compu-sta>foo: FOO, bar: BAR</ui-t-compu-sta>")

  const updates = ["/formated", "/ui-t-compu-sta/0/parsed"]
  app.reactive.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  app.state.formated = "HELLO/WORLD"
  await app

  t.eq(app.reactive.data, {
    "ui-t-compu-sta": { 0: {} },
    "formated": "HELLO/WORLD",
  })
  t.is(cnt, 2)
  t.is(
    app.el.innerHTML,
    "<ui-t-compu-sta>foo: HELLO, bar: WORLD</ui-t-compu-sta>"
  )
})

test("computed", "computed prop", async (t) => {
  t.plan(12)
  let cnt = 0

  await Component.define(
    class extends Component {
      static definition = {
        tag: "ui-t-compu-prop",

        props: {
          formated: {
            type: "string",
          },
          parsed: {
            type: "array",
            computed: "{{formated|>split('/')}}",
          },
        },

        content: {
          scope: "parsed",
          content: "foo: {{0}}, bar: {{1}}",
        },
      }

      split(formated, sep) {
        cnt++
        return formated.split(sep)
      }
    }
  )

  const app = await ui(tmp(true), {
    content: {
      tag: "ui-t-compu-prop",
      formated: "FOO/BAR",
    },
  })

  const el = app.query("ui-t-compu-prop")

  t.eq(Object.keys(app.ctx.renderers), [
    "/ui-t-compu-prop/0/formated",
    "/ui-t-compu-prop/0/parsed/0",
    "/ui-t-compu-prop/0/parsed/1",
  ])
  t.is(cnt, 1)
  t.eq(app.reactive.data, {
    "ui-t-compu-prop": { 0: { formated: "FOO/BAR" } },
  })

  t.eq(el.parsed, ["FOO", "BAR"])

  t.is(
    app.el.innerHTML,
    "<ui-t-compu-prop>foo: FOO, bar: BAR</ui-t-compu-prop>"
  )

  const updates = ["/ui-t-compu-prop/0/formated", "/ui-t-compu-prop/0/parsed"]
  app.reactive.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  el.formated = "HELLO/WORLD"
  await app

  t.is(
    app.el.innerHTML,
    "<ui-t-compu-prop>foo: HELLO, bar: WORLD</ui-t-compu-prop>"
  )
  t.is(cnt, 2)
  t.eq(app.reactive.data, {
    "ui-t-compu-prop": { 0: { formated: "HELLO/WORLD" } },
  })

  t.eq(el.parsed, ["HELLO", "WORLD"])

  t.throws(() => {
    el.parsed = "fail"
  })
})
