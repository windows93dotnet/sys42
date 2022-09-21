import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(1000)

test("render picto", async (t, { dest, decay }) => {
  const app = await decay(
    ui(dest({ connect: true }), {
      tag: "ui-picto",
      value: "puzzle",
    })
  )

  const el = app.el.querySelector("ui-picto")

  t.eq(app.reactive.data, {}, 'picto "value" should not register in state')

  t.is(el.value, "puzzle")
  t.is(el.className, "picto--puzzle")

  el.value = "folder"

  t.is(el.value, "folder")
  t.is(el.className, "picto--folder")
})
