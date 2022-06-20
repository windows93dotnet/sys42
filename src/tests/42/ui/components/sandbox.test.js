import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

const tmp = test.utils.container({ id: "ui-sandbox-tests", connect: true })

test.suite.timeout(1000)

test(1, async (t) => {
  const app = await ui(tmp(), {
    tag: "ui-sandbox",
  })

  t.eq(app.satte.value)
})
