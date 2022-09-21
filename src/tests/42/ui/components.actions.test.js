import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/class/Component.js"

/* actions
========== */

async function makeSuite(name, def) {
  Component.define(
    class extends Component {
      static definition = { tag: `ui-t-${name}`, ...def }

      x(...args) {
        this.ctx.state.from = ["x", `ui-t-${name}`]
        this.ctx.state.args = args
      }
      y(...args) {
        this.ctx.state.from = ["y", `ui-t-${name}`]
        this.ctx.state.args = args
      }
      z(...args) {
        this.ctx.state.from = ["z", `ui-t-${name}`]
        this.ctx.state.args = args
      }

      a = {
        b(...args) {
          this.ctx.state.from = ["a.b", `ui-t-${name}`]
          this.ctx.state.args = args
        },
        c(...args) {
          this.ctx.state.from = ["a.c", `ui-t-${name}`]
          this.ctx.state.args = args
        },
        d(...args) {
          this.ctx.state.from = ["a.d", `ui-t-${name}`]
          this.ctx.state.args = args
        },
      }
    }
  )

  Component.define(
    class extends Component {
      static definition = { tag: `ui-t-${name}-child`, ...def }

      x(...args) {
        this.ctx.state.from = ["x", `ui-t-${name}-child`]
        this.ctx.state.args = args
      }

      a = {
        b(...args) {
          this.ctx.state.from = ["a.b", `ui-t-${name}-child`]
          this.ctx.state.args = args
        },
      }
    }
  )

  Component.define(
    class extends Component {
      static definition = { tag: `ui-t-${name}-child-child`, ...def }

      x(...args) {
        this.ctx.state.from = ["x", `ui-t-${name}-child-child`]
        this.ctx.state.args = args
      }

      a = {
        b(...args) {
          this.ctx.state.from = ["a.b", `ui-t-${name}-child-child`]
          this.ctx.state.args = args
        },
      }
    }
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

  const app = await test.utils.decay(
    ui(test.utils.dest({ connect: true }), { content, actions })
  )

  for (const [click, level, check] of checks) {
    test.serial(click, level, async (t) => {
      await check(t)
    })
  }
}

await makeSuite("actions")
// await makeSuite("actions-props", { props: { foo: "foo" } })
await makeSuite("actions-computed", { computed: { bar: "{{[1,2]}}" } })
