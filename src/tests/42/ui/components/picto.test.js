import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(5000)

const apps = []
const cleanup = (app) => apps.push(app)
const tmp = test.utils.container({ id: "ui-picto-tests", connect: true }, () =>
  apps.forEach((app) => app?.destroy())
)

test("render picto", async (t) => {
  const app = await ui(tmp(), {
    tag: "ui-picto",
    value: "puzzle",
  })

  cleanup(app)

  const el = app.query("ui-picto")

  t.is(el.value, "puzzle")
  t.is(el.className, "picto--puzzle")

  el.value = "folder"

  t.is(el.value, "folder")
  t.is(el.className, "picto--folder")
})
