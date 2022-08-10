import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(5000)

test("render picto", async (t, { dest, collect }) => {
  const app = await collect(
    ui(dest(true), {
      tag: "ui-picto",
      value: "puzzle",
    })
  )

  const el = app.query("ui-picto")

  t.is(el.value, "puzzle")
  t.is(el.className, "picto--puzzle")

  el.value = "folder"

  t.is(el.value, "folder")
  t.is(el.className, "picto--folder")
})
