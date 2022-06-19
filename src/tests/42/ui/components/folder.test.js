import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

const tmp = test.utils.container({ id: "ui-folder-tests", connect: true })

test.suite.timeout(1000)

test("html", async (t) => {
  const app = await ui(tmp(), {
    tag: "ui-folder",
    path: "/tests/fixtures/folder/",
    selection: ["/tests/fixtures/folder/script.js"],
  })

  t.eq(app.state.value, {
    "ui-folder": {
      0: {
        path: "/tests/fixtures/folder/",
        glob: undefined,
        selection: ["/tests/fixtures/folder/script.js"],
      },
    },
    "ui-icon": {
      0: {
        small: undefined,
        label: true,
        path: { $ref: "/ui-folder/0/items/0" },
      },
      1: {
        small: undefined,
        label: true,
        path: { $ref: "/ui-folder/0/items/1" },
      },
      2: {
        small: undefined,
        label: true,
        path: { $ref: "/ui-folder/0/items/2" },
      },
    },
  })

  t.is(
    app.el.textContent,
    `\
subfolder
script\u200b.js
style\u200b.css
`
  )

  // t.is(app.el.innerHTML)
})
