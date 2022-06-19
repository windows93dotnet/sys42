import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/class/Component.js"

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

test.tasks(
  [
    {
      component: class extends Component {
        static definition = { tag: "ui-t-basic" }
      },
      html: "<ui-t-basic></ui-t-basic>",
      def: { tag: "ui-t-basic" },
      expected: "<ui-t-basic></ui-t-basic>",
    },

    {
      component: class extends Component {
        static definition = { tag: "ui-t-string" }
        render() {
          return "hello"
        }
      },
      html: "<ui-t-string></ui-t-string>",
      def: { tag: "ui-t-string" },
      expected: "<ui-t-string>hello</ui-t-string>",
    },

    {
      component: class extends Component {
        static definition = { tag: "ui-t-attr", class: "derp" }
        render() {
          return "hello"
        }
      },
      def: { tag: "ui-t-attr" },
      expected: '<ui-t-attr class="derp">hello</ui-t-attr>',
    },

    {
      component: {
        tag: "ui-t-data",
        content: "foo: {{foo}}",
      },
      def: {
        content: { tag: "ui-t-data" },
        data: { foo: 1 },
      },
      expected: "<ui-t-data>foo: 1</ui-t-data>",
    },

    {
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
        data: { foo: "bar" },
      },
      expected: "<ui-t-dynamic>x:bar</ui-t-dynamic>",
    },

    {
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
        const el = app.get("ui-t-signal")
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
    },

    {
      def: {
        content: { tag: "ui-t-props", bar: 0 },
        data: { foo: 1 },
      },
      expected: '<ui-t-props bar="0">foo: 1, bar: 0</ui-t-props>',
    },

    {
      def: {
        content: { tag: "ui-t-props" },
        data: { foo: 1 },
      },
      expected: '<ui-t-props bar="2">foo: 1, bar: 2</ui-t-props>',
      async check(t, app) {
        const el = app.get("ui-t-props")

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
    },

    {
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
        data: { foo: 1 },
      },
      expected: '<ui-t-props-state bar="2">foo: 1, bar: 2</ui-t-props-state>',
      async check(t, app) {
        const el = app.get("ui-t-props-state")

        t.is(app.state.get("bar"), 2)
        t.is(el.bar, 2)

        app.state.set("bar", 3)
        await app

        t.is(el.bar, 3)
        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="3">foo: 1, bar: 3</ui-t-props-state>'
        )

        el.bar = 4
        t.is(app.state.get("bar"), 4)
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="4">foo: 1, bar: 4</ui-t-props-state>'
        )

        el.setAttribute("bar", "5")
        t.is(app.state.get("bar"), 5)
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="5">foo: 1, bar: 5</ui-t-props-state>'
        )
      },
    },

    {
      component(t) {
        t.plan(2)
        return class extends Component {
          static definition = {
            tag: "ui-t-filter",
            props: {
              bar: 2,
            },
            content: "foo: {{/foo|add5}}, bar: {{bar|add10}}",
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
        data: { foo: 1 },
      },
      expected: '<ui-t-filter bar="2">foo: 6, bar: 12</ui-t-filter>',
    },

    {
      component: {
        tag: "ui-t-ready",
        content: "ext: {{/foo|extname}}",
      },
      def: {
        content: { tag: "ui-t-ready" },
        data: { foo: "/42/index.html" },
      },
      expected: "<ui-t-ready>ext: .html</ui-t-ready>",
    },

    {
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
    },

    {
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
    },

    {
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
        app.state.set("foo", "red")
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css-state style="--foo:red;"></ui-t-css-state>'
        )

        app.state.set("foo", undefined)
        await app

        t.is(app.el.innerHTML, '<ui-t-css-state style=""></ui-t-css-state>')

        app.state.set("foo", "blue")
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css-state style="--foo:blue;"></ui-t-css-state>'
        )

        app.state.delete("foo")
        await app

        t.is(app.el.innerHTML, '<ui-t-css-state style=""></ui-t-css-state>')
      },
    },

    {
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
            content: "hello {{path|customFilter}}",
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
    },
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
    repeat: {
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
  t.eq(app.state.value, {
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

    data: {
      y: "foo",
    },
  })

  t.eq(app.state.value, {
    "y": "foo",
    "ui-t-state": {
      0: { x: { $ref: "/y" } },
    },
  })
  t.is(app.el.textContent, "x:foo-")

  app.data.y = "bar"
  await app

  t.is(app.el.textContent, "x:bar-")
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
  t.eq(app.state.value, {
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
  t.eq(app.state.value, {
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
  t.eq(app.state.value, {
    "ui-t-nested-fixed": { 0: { list: [{ foo: "a" }, { foo: "b" }] } },
    "ui-t-state": { 0: { x: "fixed" }, 1: { x: "fixed" } },
  })
})

Component.define({
  tag: "ui-t-nested-dynamic",

  props: {
    list: {
      type: "array",
    },
  },

  content: {
    scope: "list",
    repeat: {
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
        { foo: "b" },
      ],
    },
  })

  t.eq(app.state.value, {
    "ui-t-nested-dynamic": { 0: { list: [{ foo: "a" }, { foo: "b" }] } },
    "ui-t-state": {
      0: { x: { $ref: "/ui-t-nested-dynamic/0/list/0/foo" } },
      1: { x: { $ref: "/ui-t-nested-dynamic/0/list/1/foo" } },
    },
  })
  t.is(app.el.textContent, "x:a-x:b-")

  const el = app.get("ui-t-nested-dynamic")

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

Component.define({
  tag: "ui-t-nested-string-array",

  props: {
    list: {
      type: "array",
    },
  },

  content: {
    scope: "list",
    repeat: {
      tag: "ui-t-state",
      x: "{{.}}",
    },
  },
})

async function testStringArray(t, app) {
  t.is(app.el.textContent, "x:a-x:b-")

  app.data.arr = ["A"]
  await app

  t.is(app.el.textContent, "x:A-")

  app.data.arr.push("B")
  await app

  t.is(app.el.textContent, "x:A-x:B-")

  app.data.arr[0] = "foo"
  await app

  t.is(app.el.textContent, "x:foo-x:B-")
}

test("state", "string array", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      repeat: {
        tag: "ui-t-state",
        x: "{{.}}",
      },
    },

    data: {
      arr: ["a", "b"],
    },
  })

  await testStringArray(t, app)
})

async function testStringArrayWithTransfers(t, app) {
  t.eq(app.state.value, {
    "arr": ["a", "b"],
    "ui-t-nested-string-array": { 0: { list: { $ref: "/arr" } } },
    "ui-t-state": {
      0: { x: { $ref: "/arr/0" } },
      1: { x: { $ref: "/arr/1" } },
    },
  })

  await testStringArray(t, app)

  t.eq(app.state.value, {
    "arr": ["foo", "B"],
    "ui-t-nested-string-array": { 0: { list: { $ref: "/arr" } } },
    "ui-t-state": {
      0: { x: { $ref: "/arr/0" } },
      1: { x: { $ref: "/arr/1" } },
    },
  })

  app.get("ui-t-nested-string-array").destroy()

  t.eq(app.state.value, {
    "arr": ["foo", "B"],
    "ui-t-nested-string-array": {},
    "ui-t-state": {},
  })
}

test("state", "string array", "using transfers", async (t) => {
  const app = await ui(tmp(true), {
    content: {
      tag: "ui-t-nested-string-array",
      list: "{{arr}}",
    },

    data: {
      arr: ["a", "b"],
    },
  })

  await testStringArrayWithTransfers(t, app)
})

test("state", "string array", "using transfers and async data", async (t) => {
  const app = await ui(tmp(true), {
    content: {
      tag: "ui-t-nested-string-array",
      list: "{{arr}}",
    },

    async data() {
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
          parsed: "{{formated|split('/')}}",
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
  t.eq(app.state.value, {
    "ui-t-computed": { 0: { formated: "FOO/BAR" } },
  })
  t.is(app.el.innerHTML, "<ui-t-computed>foo: FOO, bar: BAR</ui-t-computed>")

  const updates = ["/ui-t-computed/0/formated", "/ui-t-computed/0/parsed"]
  app.state.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  app.get("ui-t-computed").formated = "HELLO/WORLD"
  await app

  t.is(
    app.el.innerHTML,
    "<ui-t-computed>foo: HELLO, bar: WORLD</ui-t-computed>"
  )
  t.is(cnt, 2)
  t.eq(app.state.value, {
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
          parsed: "{{formated|split('/')}}",
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
  t.eq(app.state.value, {
    "ui-t-compu-sta": { 0: {} },
    "formated": "FOO/BAR",
  })
  t.is(app.el.innerHTML, "<ui-t-compu-sta>foo: FOO, bar: BAR</ui-t-compu-sta>")

  const updates = ["/formated", "/ui-t-compu-sta/0/parsed"]
  app.state.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  app.data.formated = "HELLO/WORLD"
  await app

  t.eq(app.state.value, {
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
            computed: "{{formated|split('/')}}",
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

  const el = app.get("ui-t-compu-prop")

  t.eq(Object.keys(app.ctx.renderers), [
    "/ui-t-compu-prop/0/formated",
    "/ui-t-compu-prop/0/parsed/0",
    "/ui-t-compu-prop/0/parsed/1",
  ])
  t.is(cnt, 1)
  t.eq(app.state.value, {
    "ui-t-compu-prop": { 0: { formated: "FOO/BAR" } },
  })

  t.eq(el.parsed, ["FOO", "BAR"])

  t.is(
    app.el.innerHTML,
    "<ui-t-compu-prop>foo: FOO, bar: BAR</ui-t-compu-prop>"
  )

  const updates = ["/ui-t-compu-prop/0/formated", "/ui-t-compu-prop/0/parsed"]
  app.state.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  el.formated = "HELLO/WORLD"
  await app

  t.is(
    app.el.innerHTML,
    "<ui-t-compu-prop>foo: HELLO, bar: WORLD</ui-t-compu-prop>"
  )
  t.is(cnt, 2)
  t.eq(app.state.value, {
    "ui-t-compu-prop": { 0: { formated: "HELLO/WORLD" } },
  })

  t.eq(el.parsed, ["HELLO", "WORLD"])

  t.throws(() => {
    el.parsed = "fail"
  })
})
