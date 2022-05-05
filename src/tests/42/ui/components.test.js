/* eslint-disable unicorn/no-object-as-default-parameter */
import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/class/Component2.js"
import repaint from "../../../42/fabric/type/promise/repaint.js"

const elements = []
function div({ connect } = { connect: true }) {
  const el = document.createElement("div")
  elements.push(el)
  if (connect) document.body.append(el)
  return el
}

test.afterEach(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

test.tasks(
  [
    {
      component: class extends Component {
        static definition = { tag: "ui-t-basic" }
      },
      html: "<ui-t-basic></ui-t-basic>",
      def: { type: "ui-t-basic" },
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
      def: { type: "ui-t-string" },
      expected: "<ui-t-string>hello</ui-t-string>",
    },

    {
      component: class extends Component {
        static definition = { tag: "ui-t-attr", class: "derp" }
        render() {
          return "hello"
        }
      },
      def: { type: "ui-t-attr" },
      expected: '<ui-t-attr class="derp">hello</ui-t-attr>',
    },

    {
      component: class extends Component {
        static definition = {
          tag: "ui-t-data",
          content: "foo: {{foo}}",
        }
      },
      def: {
        content: { type: "ui-t-data" },
        data: { foo: 1 },
      },
      expected: "<ui-t-data>foo: 1</ui-t-data>",
    },

    {
      // only: true,
      component: class extends Component {
        static definition = {
          tag: "ui-t-props",
          properties: {
            bar: 2,
          },
          content: "foo: {{foo}}, bar: {{bar}}",
        }
      },
      def: {
        content: { type: "ui-t-props" },
        data: { foo: 1 },
      },
      expected: '<ui-t-props bar="2">foo: 1, bar: 2</ui-t-props>',
      async check(t, app) {
        const el = app.get("ui-t-props")

        t.is(app.state.get("bar"), 2)

        app.state.set("bar", 3)
        await repaint()

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="3">foo: 1, bar: 3</ui-t-props>'
        )

        el.bar = 4
        t.is(app.state.get("bar"), 4)
        await repaint()

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="4">foo: 1, bar: 4</ui-t-props>'
        )

        el.setAttribute("bar", "5")
        t.is(app.state.get("bar"), 5)
        await repaint()

        t.is(
          app.el.innerHTML,
          '<ui-t-props bar="5">foo: 1, bar: 5</ui-t-props>'
        )
      },
    },

    {
      skip: true,
      component: class extends Component {
        static definition = {
          tag: "ui-t-signal",
        }
      },
      def: {
        content: { type: "ui-t-signal" },
      },
    },
  ],

  ({ title, component, args, html, def, check, expected }) => {
    test(title ?? def, async (t) => {
      if (component) {
        const fn = await (/^\s*class/.test(component.toString())
          ? Component.define(component)
          : Component.define(component(t)))

        if (args) {
          const el = fn(...args)
          if (expected) t.is(el.outerHTML, expected)
        }
      }

      const app = await ui(div(), def)

      if (expected) t.is(app.el.innerHTML, expected)
      if (check) await check(t, app)

      if (html) {
        const el = div()
        el.innerHTML = html
        t.is(el.innerHTML, expected)
      }
    })
  }
)
