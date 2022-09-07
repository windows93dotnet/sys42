import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(1000)

test(1, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(), {
      tag: "ui-sandbox",
      permissions: "app",
    })
  )

  t.eq(app.reactive.data, {
    ui: {
      sandbox: {
        root: {
          permissions: "app",
          path: undefined,
          content: undefined,
          html: undefined,
          script: undefined,
          zoom: 1,
          check: false,
        },
      },
    },
  })
})
