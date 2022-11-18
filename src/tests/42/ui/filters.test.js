import test from "../../../42/test.js"
import ui from "../../../42/ui.js"

test.flaky("render", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      content: "{{render(hello)}}",
      state: {
        hello: "{{1+1}}",
      },
    })
  )

  t.is(app.el.textContent, "2")
})
