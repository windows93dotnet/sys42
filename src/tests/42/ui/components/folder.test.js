import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(5000)

const apps = []
const cleanup = (app) => apps.push(app)
const tmp = test.utils.container({ id: "ui-folder-tests", connect: true }, () =>
  apps.forEach((app) => app?.destroy())
)

test("generate icon list", async (t) => {
  const app = await ui(tmp(), {
    tag: "ui-folder",
    path: "/tests/fixtures/components/folder/",
    selection: ["/tests/fixtures/components/folder/script.js"],
  })

  cleanup(app)

  t.eq(app.reactive.data, {
    "ui-folder": {
      0: {
        path: "/tests/fixtures/components/folder/",
        glob: undefined,
        selection: ["/tests/fixtures/components/folder/script.js"],
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

  const el = app.query("ui-folder")
  const icons = app.each("ui-icon", { live: true })

  t.eq(el.selection, ["/tests/fixtures/components/folder/script.js"])

  t.eq(icons.textContent, [
    "subfolder", //
    "script\u200b.js",
    "style\u200b.css",
  ])

  t.eq(icons.getAttribute("aria-selected"), [
    "false", //
    "true",
    "false",
  ])

  el.selection.push("/tests/fixtures/components/folder/style.css")
  await app

  t.eq(icons.getAttribute("aria-selected"), [
    "false", //
    "true",
    "true",
  ])

  el.selection = ["/tests/fixtures/components/folder/subfolder/"]
  await app

  t.eq(icons.getAttribute("aria-selected"), [
    "true", //
    "false",
    "false",
  ])

  el.path = "/tests/fixtures/components/folder/subfolder/"
  await app

  t.eq(icons.textContent, [
    "file\u200b.txt", //
  ])

  t.eq(el.selection, [])
})
