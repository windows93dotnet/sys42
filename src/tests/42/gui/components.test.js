import test from "../../../42/test.js"
import ui from "../../../42/gui.js"
import Component from "../../../42/gui/class/Component.js"

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

Component.define({
  tag: "ui-t-props",
  props: {
    bar: 2,
  },
  content: "foo: {{foo}}, bar: {{bar}}",
})

test("tag", async (t) => {
  const app = await ui(tmp(), { tag: "ui-t-props" })
  t.is(app.el.innerHTML, "<ui-t-props>foo: , bar: 2</ui-t-props>")
})
