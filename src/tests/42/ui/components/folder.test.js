import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(1000)

test("generate icon list", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest(true), {
      tag: "ui-folder",
      path: "/tests/fixtures/components/folder/",
      selection: ["/tests/fixtures/components/folder/script.js"],
    })
  )

  t.eq(t.utils.omit(app.reactive.data, ["$computed"]), {
    ui: {
      folder: {
        root: {
          path: "/tests/fixtures/components/folder/",
          glob: undefined,
          selection: ["/tests/fixtures/components/folder/script.js"],
        },
      },
      icon: {
        "root,ui-folder,div,[0]": {
          small: undefined,
          label: true,
          path: { $ref: "/ui/folder/root/items/0" },
        },
        "root,ui-folder,div,[1]": {
          small: undefined,
          label: true,
          path: { $ref: "/ui/folder/root/items/1" },
        },
        "root,ui-folder,div,[2]": {
          small: undefined,
          label: true,
          path: { $ref: "/ui/folder/root/items/2" },
        },
      },
    },
  })

  const el = app.el.querySelector("ui-folder")
  const icons = t.puppet.$("ui-icon", { live: true, base: app.el })

  t.eq(el.selection, ["/tests/fixtures/components/folder/script.js"])

  t.eq(icons.textContent, [
    "subfolder", //
    "script\u200b.js",
    "style\u200b.css",
  ])

  t.eq(icons.tabIndex, [
    0, //
    -1,
    -1,
  ])

  t.eq(icons.getAttribute("aria-description"), [
    "folder", //
    "file",
    "file",
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
