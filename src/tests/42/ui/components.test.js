import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/classes/Component.js"

Component.define({
  tag: "ui-t-props",
  props: {
    bar: { default: 2, reflect: true },
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
        static plan = { tag: "ui-t-basic" }
      },
      html: "<ui-t-basic></ui-t-basic>",
      plan: { tag: "ui-t-basic" },
      expected: "<ui-t-basic><!--[rendered]--></ui-t-basic>",
    }),

    task({
      component: class extends Component {
        static plan = { tag: "ui-t-string" }
        render() {
          return "hello"
        }
      },
      html: "<ui-t-string></ui-t-string>",
      plan: { tag: "ui-t-string" },
      expected: "<ui-t-string><!--[rendered]-->hello</ui-t-string>",
    }),

    task({
      component: class extends Component {
        static plan = { tag: "ui-t-attr", class: "derp" }
        render() {
          return "hello"
        }
      },
      plan: { tag: "ui-t-attr" },
      expected: '<ui-t-attr class="derp"><!--[rendered]-->hello</ui-t-attr>',
    }),

    task({
      component: {
        tag: "ui-t-data",
        content: "foo: {{foo}}",
      },
      plan: {
        content: { tag: "ui-t-data" },
        state: { foo: 1 },
      },
      expected: "<ui-t-data><!--[rendered]-->foo: 1</ui-t-data>",
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
      plan: {
        content: {
          tag: "ui-t-dynamic",
          x: "{{foo}}",
        },
        state: { foo: "bar" },
      },
      expected: "<ui-t-dynamic><!--[rendered]-->x:bar</ui-t-dynamic>",
    }),

    task({
      title: "lifecycle",
      connect: true,
      component(t) {
        t.plan(17)
        const stub = t.stub()
        const reasons = [
          "ui-t-signal destroyed", //
          "ui destroyed",
        ]
        return class extends Component {
          static plan = {
            tag: "ui-t-signal",

            props: {
              foo: "bar",
            },
          }

          setup({ signal }) {
            signal.addEventListener("abort", () => {
              const expected = reasons.shift()
              t.true(signal.reason instanceof DOMException)
              t.is(signal.reason.name, "AbortError")
              t.is(signal.reason.message, expected)
              t.isString(signal.reason.stack)
              t.true(signal.reason.stack.length > "Error".length)
            })
            this.addEventListener("click", stub, { signal })
          }
        }
      },
      plan: {
        content: { tag: "ui-t-signal" },
      },
      async check(t, app) {
        const el = app.el.querySelector("ui-t-signal")
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

        await el.init({}, app.stage)
        app.el.append(el)
        await el.ready
        el.click()
        t.is(stub.count, 3)

        el.click()
        t.is(stub.count, 4)

        await app.destroy()
        el.click()
        t.is(stub.count, 4)
      },
    }),

    task({
      plan: {
        content: { tag: "ui-t-props", bar: 0 },
        state: { foo: 1 },
      },
      expected:
        '<ui-t-props bar="0"><!--[rendered]-->foo: 1, bar: 0</ui-t-props>',
    }),

    task({
      plan: {
        content: { tag: "ui-t-props" },
        state: { foo: 1 },
      },
      expected:
        '<ui-t-props bar="2"><!--[rendered]-->foo: 1, bar: 2</ui-t-props>',
      async check(t, app) {
        const el = app.el.querySelector("ui-t-props")

        t.is(el.bar, 2)

        el.bar = 3
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="3"><!--[rendered]-->foo: 1, bar: 3</ui-t-props>',
        )

        el.bar = 4
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="4"><!--[rendered]-->foo: 1, bar: 4</ui-t-props>',
        )

        el.setAttribute("bar", "5")
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="5"><!--[rendered]-->foo: 1, bar: 5</ui-t-props>',
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
            storeInRootState: true,
            reflect: true,
          },
        },
        content: "foo: {{foo}}, bar: {{bar}}",
      },
      plan: {
        content: { tag: "ui-t-props-state" },
        state: { foo: 1 },
      },
      expected:
        '<ui-t-props-state bar="2"><!--[rendered]-->foo: 1, bar: 2</ui-t-props-state>',
      async check(t, app) {
        const el = app.el.querySelector("ui-t-props-state")

        t.is(app.reactive.get("bar"), 2)
        t.is(el.bar, 2)

        app.reactive.set("bar", 3)
        await app

        t.is(el.bar, 3)
        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="3"><!--[rendered]-->foo: 1, bar: 3</ui-t-props-state>',
        )

        el.bar = 4
        t.is(app.reactive.get("bar"), 4)
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="4"><!--[rendered]-->foo: 1, bar: 4</ui-t-props-state>',
        )

        el.setAttribute("bar", "5")
        t.is(app.reactive.get("bar"), 5)
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-props-state bar="5"><!--[rendered]-->foo: 1, bar: 5</ui-t-props-state>',
        )
      },
    }),

    task({
      component(t) {
        t.plan(2)
        return class extends Component {
          static plan = {
            tag: "ui-t-filter",
            props: {
              bar: { type: "number", default: 2, reflect: true },
            },
            content: "foo: {{/foo |> add5(^^)}}, bar: {{bar |> add10(^^)}}",
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
      plan: {
        content: { tag: "ui-t-filter" },
        state: { foo: 1 },
      },
      expected:
        '<ui-t-filter bar="2"><!--[rendered]-->foo: 6, bar: 12</ui-t-filter>',
    }),

    task({
      component: {
        tag: "ui-t-ready",
        content: "ext: {{/foo |> getExtname(^^)}}",
      },
      plan: {
        content: { tag: "ui-t-ready" },
        state: { foo: "/42/index.html" },
      },
      expected: "<ui-t-ready><!--[rendered]-->ext: .html</ui-t-ready>",
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
      plan: {
        content: { tag: "ui-t-noprops" },
      },
      expected: "<ui-t-noprops><!--[rendered]-->foo: </ui-t-noprops>",
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
      plan: {
        content: { tag: "ui-t-css" /* , foo: "red" */ },
      },
      expected: "<ui-t-css><!--[rendered]--></ui-t-css>",
      async check(t, app) {
        const el = app.el.firstChild
        el.foo = "red"
        await app

        t.match(
          app.el.innerHTML,
          /<ui-t-css style="--foo:\s*red;"><!--\[rendered]--><\/ui-t-css>/,
        )

        el.foo = undefined
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css style=""><!--[rendered]--></ui-t-css>',
        )

        el.foo = "blue"
        await app

        t.match(
          app.el.innerHTML,
          /<ui-t-css style="--foo:\s*blue;"><!--\[rendered]--><\/ui-t-css>/,
        )

        el.foo = undefined
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css style=""><!--[rendered]--></ui-t-css>',
        )
      },
    }),

    task({
      component: {
        tag: "ui-t-css-state",
        props: {
          foo: {
            type: "string",
            css: true,
            storeInRootState: true,
          },
        },
      },
      plan: {
        content: { tag: "ui-t-css-state" /* , foo: "red" */ },
      },
      expected: "<ui-t-css-state><!--[rendered]--></ui-t-css-state>",
      async check(t, app) {
        app.reactive.set("foo", "red")
        await app

        t.match(
          app.el.innerHTML,
          /<ui-t-css-state style="--foo:\s*red;"><!--\[rendered]--><\/ui-t-css-state>/,
        )

        app.reactive.set("foo", undefined)
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css-state style=""><!--[rendered]--></ui-t-css-state>',
        )

        app.reactive.set("foo", "blue")
        await app

        t.match(
          app.el.innerHTML,
          /<ui-t-css-state style="--foo:\s*blue;"><!--\[rendered]--><\/ui-t-css-state>/,
        )

        app.reactive.delete("foo")
        await app

        t.is(
          app.el.innerHTML,
          '<ui-t-css-state style=""><!--[rendered]--></ui-t-css-state>',
        )
      },
    }),

    task({
      title: "update throttle bug",
      defer: true,
      component(t) {
        t.plan(2)
        return class extends Component {
          static plan = {
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
      plan: {
        content: { tag: "ui-t-throttle", path: "world" },
      },
      expected:
        '<ui-t-throttle path="world"><!--[rendered]-->hello WORLD</ui-t-throttle>',
    }),
  ],

  (
    test,
    { title, defer, connect, component, args, html, plan, check, expected },
  ) => {
    test(title ?? expected ?? plan, async (t) => {
      t.timeout(1000)

      if (component) {
        if (defer) {
          defer = t
            .sleep(20)
            .then(() => checkDefine(component, t, args, expected))
        } else await checkDefine(component, t, args, expected)
      }

      const app = await t.utils.decay(ui(t.utils.dest({ connect }), plan))

      if (expected) t.is(app.el.innerHTML, expected, "ui declaration error")
      if (check) await check(t, app)

      if (html) {
        const el = t.utils.dest({ connect })
        el.innerHTML = html
        await el.firstChild.ready
        t.is(el.innerHTML, expected, "html declaration error")
      }

      if (defer) {
        await Promise.all([defer, t.utils.nextCycle()])
      }
    })
  },
)

test("component child", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-t-props",
        bar: 4,
        content: {
          tag: "em",
          content: "derp:{{derp}}, bar:{{bar}}",
        },
      },
      state: { derp: 5 },
    }),
  )

  t.eq(app.reactive.data, {
    derp: 5,
    $ui: { "t-props": { root: { bar: 4 } } },
  })

  t.is(
    app.el.innerHTML,
    '<ui-t-props bar="4"><!--[rendered]--><em>derp:5, bar:4</em></ui-t-props>',
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
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-state",
        x: "foo",
      },
    }),
  )

  t.is(app.el.textContent, "x:foo-")
  t.eq(app.reactive.data, {
    $ui: {
      "t-state": {
        root: { x: "foo" },
      },
    },
  })
})

test("state", "template", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-state",
        x: "{{y}}",
      },

      state: {
        y: "foo",
      },
    }),
  )

  t.eq(app.reactive.data, {
    y: "foo",
    $ui: {
      "t-state": {
        root: { x: { $ref: "/y" } },
      },
    },
  })
  t.is(app.el.textContent, "x:foo-")

  app.state.y = "bar"
  await app

  t.is(app.el.textContent, "x:bar-")
})

test("state", "template", "not a ref", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-state",
        x: "prefix -> {{y}}",
      },

      state: {
        y: "foo",
      },
    }),
  )

  t.eq(app.reactive.data, {
    y: "foo",
    $ui: {
      "t-state": { root: { x: "prefix -> foo" } },
    },
  })
  t.is(app.el.textContent, "x:prefix -> foo-")

  app.state.y = "bar"
  await app

  t.is(app.el.textContent, "x:prefix -> bar-")
})

test("state", "multiple", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
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
    }),
  )

  t.is(app.el.textContent, "x:foo-x:bar-")
  t.eq(app.reactive.data, {
    $ui: {
      "t-state": {
        "root,0": { x: "foo" },
        "root,1": { x: "bar" },
      },
    },
  })
})

test("state", "scopped", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
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
    }),
  )

  t.is(app.el.textContent, "x:foo-x:bar-")
  t.eq(app.reactive.data, {
    $ui: {
      "t-state": {
        "root,0": { x: "foo" },
        "root,1": { x: "bar" },
      },
    },
  })
})

test("state", "fixed", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-nested-fixed",
        list: [
          { foo: "a" }, //
          { foo: "b" },
        ],
      },
    }),
  )

  t.is(app.el.textContent, "x:fixed-x:fixed-")
  t.eq(app.reactive.data, {
    $ui: {
      "t-nested-fixed": { root: { list: [{ foo: "a" }, { foo: "b" }] } },
      "t-state": {
        "root,ui-t-nested-fixed,[0]": { x: "fixed" },
        "root,ui-t-nested-fixed,[1]": { x: "fixed" },
      },
    },
  })
})

/* custom content
================= */

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-one",
      props: {
        bar: { default: 1, reflect: true },
        one: { default: 1, reflect: true },
      },
    }

    render({ content }) {
      return content
    }
  },
)

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-two",
      props: {
        bar: { default: 2, reflect: true },
        two: { default: 2, reflect: true },
      },
    }
  },
)

test("custom content", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-one",
        content: "hi {{bar}}",
      },
    }),
  )

  t.is(
    app.el.innerHTML,
    '<ui-one bar="1" one="1"><!--[rendered]-->hi 1</ui-one>',
  )
})

test("custom content", 2, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-one",
        bar: "{{bar}}",
        content: "hi {{bar}}, root: {{root}}",
      },

      state: {
        bar: 5,
        root: 0,
      },
    }),
  )

  t.is(
    app.el.innerHTML,
    '<ui-one one="1" bar="5"><!--[rendered]-->hi 5, root: 0</ui-one>',
  )
})

test("custom content", "nested components", 2, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-one",
        content: {
          tag: "ui-two",
          content: `
root: {{root}}
one: {{one}}
two: {{two}}
bar: {{bar}}
../bar: {{../bar}}
../../bar: {{../../bar}}
/bar: {{/bar}}
`,
        },
      },

      state: {
        root: 0,
        bar: -1,
      },
    }),
  )

  t.eq(app.reactive.data, {
    root: 0,
    bar: -1,
    $ui: {
      one: {
        root: {
          bar: 1,
          one: 1,
        },
      },
      two: {
        "root,ui-one": {
          bar: 2,
          two: 2,
        },
      },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-one bar="1" one="1"><!--[rendered]--><ui-two bar="2" two="2"><!--[rendered]-->
root: 0
one: 1
two: 2
bar: 2
../bar: 1
../../bar: -1
/bar: -1
</ui-two></ui-one>`,
  )
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

test("state", "dynamic", "push", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-nested-dynamic",
        list: [
          { foo: "a" }, //
        ],
      },
    }),
  )

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/t-nested-dynamic/root/list",
    "/$ui/t-nested-dynamic/root/list/0/foo",
  ])

  t.eq(app.reactive.data, {
    $ui: {
      "t-nested-dynamic": { root: { list: [{ foo: "a" }] } },
      "t-state": {
        "root,ui-t-nested-dynamic,[0]": {
          x: { $ref: "/$ui/t-nested-dynamic/root/list/0/foo" },
        },
      },
    },
  })

  const el = app.el.querySelector("ui-t-nested-dynamic")

  el.list.push({ foo: "b" })
  await app

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/t-nested-dynamic/root/list",
    "/$ui/t-nested-dynamic/root/list/0/foo",
    "/$ui/t-nested-dynamic/root/list/1/foo",
  ])

  t.eq(app.reactive.data, {
    $ui: {
      "t-nested-dynamic": { root: { list: [{ foo: "a" }, { foo: "b" }] } },
      "t-state": {
        "root,ui-t-nested-dynamic,[0]": {
          x: { $ref: "/$ui/t-nested-dynamic/root/list/0/foo" },
        },
        "root,ui-t-nested-dynamic,[1]": {
          x: { $ref: "/$ui/t-nested-dynamic/root/list/1/foo" },
        },
      },
    },
  })
})

test("state", "dynamic", "pop", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-t-nested-dynamic",
        list: [
          { foo: "a" }, //
          { foo: "b" }, //
        ],
      },
    }),
  )

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/t-nested-dynamic/root/list",
    "/$ui/t-nested-dynamic/root/list/0/foo",
    "/$ui/t-nested-dynamic/root/list/1/foo",
  ])

  t.eq(app.reactive.data, {
    $ui: {
      "t-nested-dynamic": { root: { list: [{ foo: "a" }, { foo: "b" }] } },
      "t-state": {
        "root,ui-t-nested-dynamic,[0]": {
          x: { $ref: "/$ui/t-nested-dynamic/root/list/0/foo" },
        },
        "root,ui-t-nested-dynamic,[1]": {
          x: { $ref: "/$ui/t-nested-dynamic/root/list/1/foo" },
        },
      },
    },
  })

  const el = app.el.querySelector("ui-t-nested-dynamic")

  el.list.pop()
  await app

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/t-nested-dynamic/root/list",
    "/$ui/t-nested-dynamic/root/list/0/foo",
  ])

  t.eq(app.reactive.data, {
    $ui: {
      "t-nested-dynamic": { root: { list: [{ foo: "a" }] } },
      "t-state": {
        "root,ui-t-nested-dynamic,[0]": {
          x: { $ref: "/$ui/t-nested-dynamic/root/list/0/foo" },
        },
      },
    },
  })
})

test("state", "dynamic", "textContent", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-t-nested-dynamic",
        list: [
          { foo: "a" }, //
          { foo: "b" },
        ],
      },
    }),
  )

  t.is(app.el.textContent, "x:a-x:b-")

  const el = app.el.querySelector("ui-t-nested-dynamic")

  el.list.push({ foo: "c" })
  await app

  t.is(app.el.textContent, "x:a-x:b-x:c-")

  el.list.pop()
  await app

  t.is(app.el.textContent, "x:a-x:b-")

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
    bar: { default: "-", reflect: true },
  },
  content: "foo: {{foo}}, bar: {{bar}}",
})

test("props", 1, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { tag: "ui-a" },
      state: { foo: 1 },
    }),
  )

  t.eq(app.reactive.data, {
    foo: 1,
    $ui: { a: { root: { bar: "-" } } },
  })

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/a/root/bar", //
    "/foo",
  ])

  t.is(app.el.innerHTML, '<ui-a bar="-"><!--[rendered]-->foo: 1, bar: -</ui-a>')

  app.el.querySelector("ui-a").bar = 0
  await app

  t.is(app.el.innerHTML, '<ui-a bar="0"><!--[rendered]-->foo: 1, bar: 0</ui-a>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-a bar="0"><!--[rendered]-->foo: 2, bar: 0</ui-a>')
})

test("props", 2, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { tag: "ui-a", bar: 0 },
      state: { foo: 1 },
    }),
  )

  t.eq(app.reactive.data, {
    foo: 1,
    $ui: { a: { root: { bar: 0 } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="0"><!--[rendered]-->foo: 1, bar: 0</ui-a>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-a bar="0"><!--[rendered]-->foo: 2, bar: 0</ui-a>')
})

test("props", 3, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [
        { tag: "ui-a#a1", bar: -1 }, //
        "\n",
        { tag: "ui-a#a2", bar: -2 },
      ],
      state: { foo: 1 },
    }),
  )

  t.eq(app.reactive.data, {
    foo: 1,
    $ui: {
      a: {
        "root,0": { bar: -1 },
        "root,2": { bar: -2 },
      },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a id="a1" bar="-1"><!--[rendered]-->foo: 1, bar: -1</ui-a>
<ui-a id="a2" bar="-2"><!--[rendered]-->foo: 1, bar: -2</ui-a>`,
  )

  app.el.querySelector("#a1").bar = -3
  await app

  t.is(
    app.el.innerHTML,
    `\
<ui-a id="a1" bar="-3"><!--[rendered]-->foo: 1, bar: -3</ui-a>
<ui-a id="a2" bar="-2"><!--[rendered]-->foo: 1, bar: -2</ui-a>`,
  )

  app.state.foo = 2
  await app

  t.is(
    app.el.innerHTML,
    `\
<ui-a id="a1" bar="-3"><!--[rendered]-->foo: 2, bar: -3</ui-a>
<ui-a id="a2" bar="-2"><!--[rendered]-->foo: 2, bar: -2</ui-a>`,
  )
})

test("props", 4, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { tag: "ui-a", bar: "{{foo}}" },
      state: { foo: "a" },
    }),
  )

  t.eq(app.reactive.data, {
    foo: "a",
    $ui: { a: { root: { bar: { $ref: "/foo" } } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="a"><!--[rendered]-->foo: a, bar: a</ui-a>')

  app.state.foo = "b"
  await app

  t.is(app.el.innerHTML, '<ui-a bar="b"><!--[rendered]-->foo: b, bar: b</ui-a>')

  app.el.querySelector("ui-a").bar = "c"
  await app

  t.eq(app.reactive.data, {
    foo: "c",
    $ui: { a: { root: { bar: { $ref: "/foo" } } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="c"><!--[rendered]-->foo: c, bar: c</ui-a>')

  app.state.foo = "d"
  await app

  t.eq(app.reactive.data, {
    foo: "d",
    $ui: { a: { root: { bar: { $ref: "/foo" } } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="d"><!--[rendered]-->foo: d, bar: d</ui-a>')
})

test.skip("props", 5, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { tag: "ui-a", bar: "{{foo |> upperCase(^^)}}" },
      state: { foo: "a" },
    }),
  )

  t.eq(app.reactive.data, {
    foo: "a",
    $ui: { a: { root: { bar: "A" } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="A"><!--[rendered]-->foo: a, bar: A</ui-a>')

  app.state.foo = "b"
  await app

  t.is(app.el.innerHTML, '<ui-a bar="B"><!--[rendered]-->foo: b, bar: B</ui-a>')

  app.el.querySelector("ui-a").bar = "c"
  await app

  t.eq(app.reactive.data, {
    foo: "b",
    $ui: { a: { root: { bar: "c" } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="c"><!--[rendered]-->foo: b, bar: c</ui-a>')

  app.state.foo = "d"
  await app

  t.eq(app.reactive.data, {
    foo: "d",
    $ui: { a: { root: { bar: "D" } } },
  })

  t.is(app.el.innerHTML, '<ui-a bar="D"><!--[rendered]-->foo: d, bar: D</ui-a>')
})

/* props state
============== */

Component.define({
  tag: "ui-b",
  props: {
    bar: {
      default: 2,
      storeInRootState: true,
      reflect: true,
    },
  },
  content: "foo: {{foo}}, bar: {{bar}}",
})

test("props state", 1, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { tag: "ui-b" },
      state: { foo: 1 },
    }),
  )

  t.eq(app.reactive.data, {
    foo: 1,
    bar: 2,
  })

  t.is(app.el.innerHTML, '<ui-b bar="2"><!--[rendered]-->foo: 1, bar: 2</ui-b>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-b bar="2"><!--[rendered]-->foo: 2, bar: 2</ui-b>')

  app.state.bar = 3
  await app

  t.eq(app.reactive.data, {
    foo: 2,
    bar: 3,
  })

  t.is(app.el.innerHTML, '<ui-b bar="3"><!--[rendered]-->foo: 2, bar: 3</ui-b>')
})

test("props state", 2, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: { tag: "ui-b", bar: 0 },
      state: { foo: 1 },
    }),
  )

  t.eq(app.reactive.data, {
    foo: 1,
    bar: 0,
  })

  t.is(app.el.innerHTML, '<ui-b bar="0"><!--[rendered]-->foo: 1, bar: 0</ui-b>')

  app.state.foo = 2
  await app

  t.is(app.el.innerHTML, '<ui-b bar="0"><!--[rendered]-->foo: 2, bar: 0</ui-b>')

  app.state.bar = 3
  await app

  t.eq(app.reactive.data, {
    foo: 2,
    bar: 3,
  })

  t.is(app.el.innerHTML, '<ui-b bar="3"><!--[rendered]-->foo: 2, bar: 3</ui-b>')
})

test("scopped", 1, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: [
        { scope: "one", content: { tag: "ui-a", bar: 0 } }, //
        "\n",
        { scope: "two", content: { tag: "ui-a", bar: 1 } },
      ],
      state: { foo: 1 },
    }),
  )

  t.eq(app.reactive.data, {
    foo: 1,
    $ui: {
      a: {
        "root,0": { bar: 0 },
        "root,2": { bar: 1 },
      },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a bar="0"><!--[rendered]-->foo: , bar: 0</ui-a>
<ui-a bar="1"><!--[rendered]-->foo: , bar: 1</ui-a>`,
  )
})

test("scopped", 2, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
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
    }),
  )

  t.eq(app.reactive.data, {
    foo: 1,
    one: { foo: 2 },
    $ui: {
      a: {
        "root,0": { bar: -1 },
        "root,2": { bar: 0 },
        "root,4": { bar: { $ref: "/one/foo" } },
        "root,6": { bar: { $ref: "/foo" } },
        "root,8": { bar: { $ref: "/foo" } },
        "root,10": { bar: 3 },
      },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a bar="-1"><!--[rendered]-->foo: 1, bar: -1</ui-a>
<ui-a bar="0"><!--[rendered]-->foo: 2, bar: 0</ui-a>
<ui-a bar="2"><!--[rendered]-->foo: 2, bar: 2</ui-a>
<ui-a bar="1"><!--[rendered]-->foo: 2, bar: 1</ui-a>
<ui-a bar="1"><!--[rendered]-->foo: 2, bar: 1</ui-a>
<ui-a bar="3"><!--[rendered]-->foo: , bar: 3</ui-a>`,
  )

  app.el.querySelector("ui-a:last-of-type").destroy()

  t.eq(app.reactive.data, {
    foo: 1,
    one: { foo: 2 },
    $ui: {
      a: {
        "root,0": { bar: -1 },
        "root,2": { bar: 0 },
        "root,4": { bar: { $ref: "/one/foo" } },
        "root,6": { bar: { $ref: "/foo" } },
        "root,8": { bar: { $ref: "/foo" } },
      },
    },
  })

  t.is(
    app.el.innerHTML,
    `\
<ui-a bar="-1"><!--[rendered]-->foo: 1, bar: -1</ui-a>
<ui-a bar="0"><!--[rendered]-->foo: 2, bar: 0</ui-a>
<ui-a bar="2"><!--[rendered]-->foo: 2, bar: 2</ui-a>
<ui-a bar="1"><!--[rendered]-->foo: 2, bar: 1</ui-a>
<ui-a bar="1"><!--[rendered]-->foo: 2, bar: 1</ui-a>\n`,
  )
})

/* array
======== */

test("array", 1, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
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
    }),
  )

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="a"><!--[rendered]-->foo: , bar: a</ui-a><!--[#]-->
<ui-a bar="b"><!--[rendered]-->foo: , bar: b</ui-a><!--[#]-->`,
  )

  t.eq(app.reactive.data, {
    arr: ["a", "b"],
    foo: 1,
    $ui: {
      a: {
        "root,[0],1": { bar: { $ref: "/arr/0" } },
        "root,[1],1": { bar: { $ref: "/arr/1" } },
      },
    },
  })

  app.state.arr.push("c")
  await app

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="a"><!--[rendered]-->foo: , bar: a</ui-a><!--[#]-->
<ui-a bar="b"><!--[rendered]-->foo: , bar: b</ui-a><!--[#]-->
<ui-a bar="c"><!--[rendered]-->foo: , bar: c</ui-a><!--[#]-->`,
  )

  t.eq(app.reactive.data, {
    arr: ["a", "b", "c"],
    foo: 1,
    $ui: {
      a: {
        "root,[0],1": { bar: { $ref: "/arr/0" } },
        "root,[1],1": { bar: { $ref: "/arr/1" } },
        "root,[2],1": { bar: { $ref: "/arr/2" } },
      },
    },
  })

  app.state.arr[0] = "A"
  await app

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="A"><!--[rendered]-->foo: , bar: A</ui-a><!--[#]-->
<ui-a bar="b"><!--[rendered]-->foo: , bar: b</ui-a><!--[#]-->
<ui-a bar="c"><!--[rendered]-->foo: , bar: c</ui-a><!--[#]-->`,
  )

  t.eq(app.reactive.data, {
    arr: ["A", "b", "c"],
    foo: 1,
    $ui: {
      a: {
        "root,[0],1": { bar: { $ref: "/arr/0" } },
        "root,[1],1": { bar: { $ref: "/arr/1" } },
        "root,[2],1": { bar: { $ref: "/arr/2" } },
      },
    },
  })

  t.eq(Object.keys(app.stage.renderers), [
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
<ui-a bar="A"><!--[rendered]-->foo: , bar: A</ui-a><!--[#]-->`,
  )

  t.eq(app.reactive.data, {
    arr: ["A"],
    foo: 1,
    $ui: { a: { "root,[0],1": { bar: { $ref: "/arr/0" } } } },
  })

  t.eq(Object.keys(app.stage.renderers), [
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
<ui-a bar="A"><!--[rendered]-->foo: , bar: A</ui-a><!--[#]-->
<ui-a bar="B"><!--[rendered]-->foo: , bar: B</ui-a><!--[#]-->`,
  )

  t.eq(app.reactive.data, {
    arr: ["A", "B"],
    foo: 1,
    $ui: {
      a: {
        "root,[0],1": { bar: { $ref: "/arr/0" } },
        "root,[1],1": { bar: { $ref: "/arr/1" } },
      },
    },
  })
})

test("array", 2, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
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
    }),
  )

  t.is(
    app.el.innerHTML,
    `\
<!--[each]-->
<ui-a bar="0 - a"><!--[rendered]-->foo: , bar: 0 - a</ui-a><!--[#]-->
<ui-a bar="1 - b"><!--[rendered]-->foo: , bar: 1 - b</ui-a><!--[#]-->`,
  )

  t.eq(app.reactive.data, {
    arr: ["a", "b"],
    foo: 1,
    $ui: {
      a: { "root,[0],1": { bar: "0 - a" }, "root,[1],1": { bar: "1 - b" } },
    },
  })
})

/* @index
========= */

Component.define({
  tag: "ui-t-index-array",

  props: {
    list: {
      type: "array",
    },
  },

  content: {
    scope: "list",
    each: {
      content: "{{@index}}:{{.}}{{@last ? '' : ', '}}",
    },
  },
})

test("@index", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-index-array",
        list: "{{arr}}",
      },

      state: {
        arr: ["a", "b"],
      },
    }),
  )

  t.is(app.el.textContent, "0:a, 1:b")

  app.state.arr = ["A"]
  await app

  t.is(app.el.textContent, "0:A")

  app.state.arr.push("B", "C")
  await app

  t.is(app.el.textContent, "0:A, 1:B, 2:C")
})

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-t-index-computed-array",

      props: {
        arr: {
          type: "array",
        },
      },

      computed: {
        list: "{{getList(arr)}}",
      },

      content: {
        scope: "list",
        each: {
          content: "{{@index}}:{{.}}{{@last ? '' : ', '}}",
        },
      },
    }

    getList(arr) {
      return JSON.parse(arr)
    }
  },
)

test("@index", "computed", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-index-computed-array",
        arr: '["a", "b"]',
      },
    }),
  )

  const el = app.el.querySelector("ui-t-index-computed-array")

  t.is(app.el.textContent, "0:a, 1:b")

  el.arr = '["A"]'
  await app

  t.is(app.el.textContent, "0:A")

  el.arr = '["A", "B", "C"]'
  await app

  t.is(app.el.textContent, "0:A, 1:B, 2:C")
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
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
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
    }),
  )

  await testStringArray(t, app)
})

async function testStringArrayWithTransfers(t, app) {
  t.eq(app.reactive.data, {
    arr: ["a", "b"],
    $ui: {
      "t-nested-string-array": { root: { list: { $ref: "/arr" } } },
      "t-state": {
        "root,ui-t-nested-string-array,[0]": { x: { $ref: "/arr/0" } },
        "root,ui-t-nested-string-array,[1]": { x: { $ref: "/arr/1" } },
      },
    },
  })

  await testStringArray(t, app)

  t.eq(app.reactive.data, {
    arr: ["foo", "B"],
    $ui: {
      "t-nested-string-array": { root: { list: { $ref: "/arr" } } },
      "t-state": {
        "root,ui-t-nested-string-array,[0]": { x: { $ref: "/arr/0" } },
        "root,ui-t-nested-string-array,[1]": { x: { $ref: "/arr/1" } },
      },
    },
  })

  app.el.querySelector("ui-t-nested-string-array").destroy()

  t.eq(app.reactive.data, {
    arr: ["foo", "B"],
    // $ui: {
    //   "t-nested-string-array": {},
    //   "t-state": {},
    // },
  })
}

test("string array", "using transfers", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-t-nested-string-array",
        list: "{{arr}}",
      },

      state: {
        arr: ["a", "b"],
      },
    }),
  )

  await testStringArrayWithTransfers(t, app)
})

test("string array", "using transfers and async state", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
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
    }),
  )

  await testStringArrayWithTransfers(t, app)
})

/* computed
=========== */

test("computed", async (t) => {
  t.plan(9)
  let cnt = 0

  Component.define(
    class extends Component {
      static plan = {
        tag: "ui-t-computed",

        props: {
          formated: {
            type: "string",
          },
        },

        computed: {
          parsed: "{{formated |> split(^^, '/')}}",
        },

        content: {
          scope: "parsed",
          content: "foo: {{./0}}, bar: {{./1}}",
        },
      }

      split(formated, delimiter) {
        cnt++
        return formated.split(delimiter)
      }
    },
  )

  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-t-computed",
        formated: "FOO/BAR",
      },
    }),
  )

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/t-computed/root/formated",
    "/$ui/t-computed/root/parsed/0",
    "/$ui/t-computed/root/parsed/1",
  ])
  t.is(cnt, 1)
  t.eq(app.reactive.data, {
    $ui: {
      "t-computed": { root: { formated: "FOO/BAR" } },
    },
    $computed: {
      $ui: { "t-computed": { root: { parsed: ["FOO", "BAR"] } } },
    },
  })
  t.is(
    app.el.innerHTML,
    "<ui-t-computed><!--[rendered]-->foo: FOO, bar: BAR</ui-t-computed>",
  )

  const updates = [
    "/$ui/t-computed/root/formated",
    "/$ui/t-computed/root/parsed",
  ]
  app.reactive.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  app.el.querySelector("ui-t-computed").formated = "HELLO/WORLD"
  await app

  t.is(
    app.el.innerHTML,
    "<ui-t-computed><!--[rendered]-->foo: HELLO, bar: WORLD</ui-t-computed>",
  )
  t.is(cnt, 2)
  t.eq(t.utils.omit(app.reactive.data, ["$computed"]), {
    $ui: {
      "t-computed": { root: { formated: "HELLO/WORLD" } },
    },
  })
})

test("computed", "from prop with state:true", async (t) => {
  t.plan(9)
  let cnt = 0

  Component.define(
    class extends Component {
      static plan = {
        tag: "ui-t-compu-sta",

        props: {
          formated: {
            type: "string",
            storeInRootState: true,
          },
        },

        computed: {
          parsed: "{{formated |> split(^^, '/')}}",
        },

        content: {
          scope: "parsed",
          content: "foo: {{./0}}, bar: {{./1}}",
        },
      }

      split(formated, delimiter) {
        cnt++
        return formated.split(delimiter)
      }
    },
  )

  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-compu-sta",
        formated: "FOO/BAR",
      },
    }),
  )

  t.eq(Object.keys(app.stage.renderers), [
    "/formated",
    "/$ui/t-compu-sta/root/parsed/0",
    "/$ui/t-compu-sta/root/parsed/1",
  ])
  t.is(cnt, 1)
  t.eq(app.reactive.data, {
    formated: "FOO/BAR",
    $computed: { $ui: { "t-compu-sta": { root: { parsed: ["FOO", "BAR"] } } } },
  })
  t.is(
    app.el.innerHTML,
    "<ui-t-compu-sta><!--[rendered]-->foo: FOO, bar: BAR</ui-t-compu-sta>",
  )

  const updates = ["/formated", "/$ui/t-compu-sta/root/parsed"]
  app.reactive.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  app.state.formated = "HELLO/WORLD"
  await app

  t.eq(app.reactive.data, {
    formated: "HELLO/WORLD",
    $computed: {
      $ui: { "t-compu-sta": { root: { parsed: ["HELLO", "WORLD"] } } },
    },
  })
  t.is(cnt, 2)
  t.is(
    app.el.innerHTML,
    "<ui-t-compu-sta><!--[rendered]-->foo: HELLO, bar: WORLD</ui-t-compu-sta>",
  )
})

test("computed", "computed prop", async (t) => {
  t.plan(12)
  let cnt = 0

  Component.define(
    class extends Component {
      static plan = {
        tag: "ui-t-compu-prop",

        props: {
          formated: {
            type: "string",
          },
          parsed: {
            type: "array",
            computed: "{{formated|>split(^^, '/')}}",
          },
        },

        content: {
          scope: "parsed",
          content: "foo: {{./0}}, bar: {{./1}}",
        },
      }

      split(formated, delimiter) {
        cnt++
        return formated.split(delimiter)
      }
    },
  )

  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-t-compu-prop",
        formated: "FOO/BAR",
      },
    }),
  )

  const el = app.el.querySelector("ui-t-compu-prop")

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/t-compu-prop/root/formated",
    "/$ui/t-compu-prop/root/parsed/0",
    "/$ui/t-compu-prop/root/parsed/1",
  ])
  t.is(cnt, 1)
  t.eq(app.reactive.data, {
    $ui: { "t-compu-prop": { root: { formated: "FOO/BAR" } } },
    $computed: {
      $ui: { "t-compu-prop": { root: { parsed: ["FOO", "BAR"] } } },
    },
  })

  t.eq(el.parsed, ["FOO", "BAR"])

  t.is(
    app.el.innerHTML,
    "<ui-t-compu-prop><!--[rendered]-->foo: FOO, bar: BAR</ui-t-compu-prop>",
  )

  const updates = [
    "/$ui/t-compu-prop/root/formated",
    "/$ui/t-compu-prop/root/parsed",
  ]
  app.reactive.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  el.formated = "HELLO/WORLD"
  await app

  t.is(
    app.el.innerHTML,
    "<ui-t-compu-prop><!--[rendered]-->foo: HELLO, bar: WORLD</ui-t-compu-prop>",
  )
  t.is(cnt, 2)
  t.eq(app.reactive.data, {
    $ui: { "t-compu-prop": { root: { formated: "HELLO/WORLD" } } },
    $computed: {
      $ui: { "t-compu-prop": { root: { parsed: ["HELLO", "WORLD"] } } },
    },
  })

  t.eq(el.parsed, ["HELLO", "WORLD"])

  t.throws(() => {
    el.parsed = "fail"
  })
})

/* Object prop
============== */

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-t-obj-prop",
      props: {
        obj: {
          default: {
            a: 1,
            b: 2,
          },
        },
      },
      content: "{{obj.a}} - {{obj/b}}",
    }
  },
)

test("obj", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        tag: "ui-t-obj-prop",
      },
    }),
  )

  t.is(app.el.textContent, "1 - 2")
  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/t-obj-prop/root/obj",
    "/$ui/t-obj-prop/root/obj/a",
    "/$ui/t-obj-prop/root/obj/b",
  ])
})

/* Scope chain
============== */

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-t-scope-chain",
      props: {
        a: 1,
      },
    }
  },
)

test("scope chain", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      tag: "ui-t-scope-chain",
      content: {
        state: {
          b: 2,
        },
        tag: "em",
        content: "a: {{a}} b: {{b}}",
      },
    }),
  )

  t.is(app.el.textContent, "a: 1 b: 2")
})

/* actions
========== */

/* Find Component Actions
------------------------- */
class ParentComponent extends Component {
  static plan = {
    tag: "ui-t-parent-cpn",
    props: { a: 1 },
    content: "{{foo()}}",
  }

  foo() {
    return "parent-foo"
  }

  bar() {
    return "parent-bar"
  }
}
Component.define(ParentComponent)

Component.define(
  class ChildComponent extends ParentComponent {
    static plan = {
      tag: "ui-t-child-cpn",
      props: { a: 1 },
    }

    foo() {
      return "child-foo"
    }

    render({ content }) {
      return content
    }
  },
)

test("find component actions", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), { tag: "ui-t-parent-cpn" }),
  )

  t.is(app.el.textContent, "parent-foo")
})

test("find component actions", "child class", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      tag: "ui-t-child-cpn",
      content: "{{foo()}} - {{bar()}}",
    }),
  )

  t.is(app.el.textContent, "child-foo - parent-bar")
})

test("find component actions", "always ignore 'render'", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      tag: "ui-t-child-cpn",
      content: "{{render('hello')}}",
    }),
  )

  t.is(app.el.textContent, "hello")
})

test("find component actions", "ignore base class methods", async (t) => {
  t.plan(2)

  const expected1 = 'Template action didn\'t resolve as a function: "/init"'
  const expected2 = 'Template filter is not a function: "init"'

  const promise = new Promise((resolve) => {
    t.utils.on({
      capture: true,
      error(e) {
        if (e.message === expected2) {
          t.pass()
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          resolve()
        }
      },
    })
  })

  try {
    await t.utils.decay(
      ui(t.utils.dest({ connect: true }), {
        tag: "ui-t-child-cpn",
        content: "{{init()}}",
      }),
    )
  } catch (err) {
    t.is(err.message, expected1)
  }

  await promise
})

/* --------- */

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-t-actions-above-root",
      computed: { y: "y" },
    }
  },
)

test("actions", "above root path", async (t) => {
  t.plan(1)

  try {
    await t.utils.decay(
      ui(t.utils.dest({ connect: true }), {
        content: {
          tag: "ui-t-actions-above-root",
          content: [{ tag: "button#child-e2", click: "{{../../../../x()}}" }],
        },

        actions: {
          x() {
            this.state.from = ["x", "ui"]
          },
        },
      }),
    )
  } catch (err) {
    t.is(
      err.message,
      "Action path is going above root by 3 level(s): ../../../../x",
    )
  }
})

/* --------- */

async function makeSuite(name, plan) {
  Component.define(
    class extends Component {
      static plan = { tag: `ui-t-${name}`, ...plan }

      x(...args) {
        this.stage.state.from = ["x", `ui-t-${name}`]
        this.stage.state.args = args
      }
      y(...args) {
        this.stage.state.from = ["y", `ui-t-${name}`]
        this.stage.state.args = args
      }
      z(...args) {
        this.stage.state.from = ["z", `ui-t-${name}`]
        this.stage.state.args = args
      }

      a = {
        b(...args) {
          this.stage.state.from = ["a.b", `ui-t-${name}`]
          this.stage.state.args = args
        },
        c(...args) {
          this.stage.state.from = ["a.c", `ui-t-${name}`]
          this.stage.state.args = args
        },
        d(...args) {
          this.stage.state.from = ["a.d", `ui-t-${name}`]
          this.stage.state.args = args
        },
      }
    },
  )

  Component.define(
    class extends Component {
      static plan = { tag: `ui-t-${name}-child`, ...plan }

      x(...args) {
        this.stage.state.from = ["x", `ui-t-${name}-child`]
        this.stage.state.args = args
      }

      a = {
        b(...args) {
          this.stage.state.from = ["a.b", `ui-t-${name}-child`]
          this.stage.state.args = args
        },
      }
    },
  )

  Component.define(
    class extends Component {
      static plan = { tag: `ui-t-${name}-child-child`, ...plan }

      x(...args) {
        this.stage.state.from = ["x", `ui-t-${name}-child-child`]
        this.stage.state.args = args
      }

      a = {
        b(...args) {
          this.stage.state.from = ["a.b", `ui-t-${name}-child-child`]
          this.stage.state.args = args
        },
      }
    },
  )

  const actions = {
    x(...args) {
      this.state.from = ["x", "ui"]
      this.state.args = args
    },
  }

  const checks = []
  const content = [
    {
      tag: `ui-t-${name}`,
      content: [
        {
          tag: `ui-t-${name}-child`,
          content: [
            {
              tag: `ui-t-${name}-child-child`, //
              content: [],
            },
          ],
        },
      ],
    },
  ]

  const levels = [
    content[0].content,
    content[0].content[0].content,
    content[0].content[0].content[0].content,
  ]

  // prettier-ignore
  const tasks = [
    { click: "{{/x(e, target)}}", level: 0, res: ["x", "ui"] },
    { click: "{{x(e, target)}}", level: 0, res: ["x", `ui-t-${name}`] },

    { click: "{{/x(e, target)}}", level: 1, res: ["x", `ui`] },
    { click: "{{x(e, target)}}", level: 1, res: ["x", `ui-t-${name}-child`] },
    // { click: "{{x(e.target, foo, bar/0)}}", level: 1, res: ["x", `ui-t-${name}-child`] },
    { click: "{{../x(e, target)}}", level: 1, res: ["x", `ui-t-${name}`] },
    { click: "{{../../x(e, target)}}", level: 1, res: ["x", `ui`] },

    { click: "{{/x(e, target)}}", level: 2, res: ["x", `ui`] },
    { click: "{{x(e, target)}}", level: 2, res: ["x", `ui-t-${name}-child-child`] },
    { click: "{{../x(e, target)}}", level: 2, res: ["x", `ui-t-${name}-child`] },
    { click: "{{../../x(e, target)}}", level: 2, res: ["x", `ui-t-${name}`] },
    { click: "{{../../../x(e, target)}}", level: 2, res: ["x", `ui`] },

    // { click: "{{./x(e, target)}}", level: 2, res: ["x", `ui-t-${name}-child-child`] },
    // { click: "{{./../x(e, target)}}", level: 2, res: ["x", `ui-t-${name}-child`] },
    // { click: "{{./../../x(e, target)}}", level: 2, res: ["x", `ui-t-${name}`] },
    // { click: "{{./../../../x(e, target)}}", level: 2, res: ["x", `ui`] },
  ]

  for (let i = 0, l = tasks.length; i < l; i++) {
    const { click, level, res } = tasks[i]
    const sel = `#btn-${level}-${i}`
    levels[level].push({ tag: `button${sel}`, click })
    checks.push([
      click,
      level,
      async (t) => {
        const el = app.el.querySelector(sel)
        el.click()
        await app
        t.eq(app.data.from, res)
        t.is(app.data.args[0]?.type, "click")
        t.is(app.data.args[1], el)
      },
    ])
  }

  let app

  async function makeApp() {
    app = await test.utils.decay(
      ui(test.utils.dest({ connect: true }), { content, actions }),
    )
  }

  for (const [click, level, check] of checks) {
    test.serial(click, level, async (t) => {
      if (!app) await makeApp()
      await check(t)
    })
  }
}

await makeSuite("actions")
await makeSuite("actions-props", { props: { foo: ["foo"] } })
await makeSuite("actions-computed", { computed: { bar: "{{['bar']}}" } })

/* ---- */

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-t-event-in-scope",
      props: { text: "---" },
      on: [
        {
          selector: "button",
          click: "{{foo(e)}}",
        },
      ],

      content: {
        tag: "button",
        content: "{{text}}",
      },
    }

    foo(e) {
      this.text = e?.type
    }
  },
)

test("component events inside scope", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        scope: "bar",
        tag: "ui-t-event-in-scope",
      },
    }),
  )

  const cpn = app.el.querySelector("ui-t-event-in-scope")
  const el = cpn.querySelector("button")

  t.is(el.textContent, "---")

  el.click()
  await app

  t.is(el.textContent, "click")
})

/* Own Scope
============ */

Component.define(
  class extends Component {
    static plan = {
      tag: "ui-t-own-scope",
      props: { foo: "---" },
      content: "{{foo}}",
    }
  },
)

test("state.$ui priority", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: {
        tag: "ui-t-own-scope",
        foo: "a",
      },
      state: {
        $ui: {
          "t-own-scope": {
            root: {
              foo: "b",
            },
          },
        },
      },
    }),
  )

  const el = app.el.querySelector("ui-t-own-scope")
  t.is(el.foo, "b")
  t.is(el.textContent, "b")
})

test("same own scope components", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      content: {
        if: "{{show}}",
        do: {
          tag: "ui-t-own-scope",
          foo: "a",
        },
        else: {
          tag: "ui-t-own-scope",
          foo: "b",
        },
      },

      state: {
        show: true,
      },
    }),
  )

  let el = app.el.querySelector("ui-t-own-scope")
  t.is(el.foo, "a")
  t.is(el.textContent, "a")

  app.state.show = false
  await app

  el = app.el.querySelector("ui-t-own-scope")
  t.is(el.textContent, "b")
  t.is(el.foo, "b")

  app.state.show = true
  await app

  // check if removed component doesn't erase state.$ui
  await t.utils.nextRepaint()

  el = app.el.querySelector("ui-t-own-scope")
  t.is(el.foo, "a")
  t.is(el.textContent, "a")
})
