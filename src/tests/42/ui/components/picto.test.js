import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(5000)

const tmp = test.utils.container({ connect: true })

test("render picto", async (t) => {
  const app = await t.utils.collect(
    ui(tmp(), {
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
