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
