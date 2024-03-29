import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(3000)

test("generate icon list", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      tag: "ui-folder",
      path: "/tests/fixtures/components/folder/",
      selection: ["/tests/fixtures/components/folder/script.js"],
    }),
  )

  // await t.sleep(100)

  // t.eq(t.utils.omit(app.reactive.data, ["$computed"]), {
  //   $ui: {
  //     folder: {
  //       root: {
  //         path: "/tests/fixtures/components/folder/",
  //         view: "grid",
  //         selection: ["/tests/fixtures/components/folder/script.js"],
  //         glob: undefined,
  //         multiselectable: true,
  //         transferable: true,
  //         selectable: true,
  //       },
  //     },
  //     grid: {
  //       "root,ui-folder": {
  //         itemTemplate: {
  //           tag: "ui-icon",
  //           aria: { selected: false },
  //           autofocus: "{{@first}}",
  //           path: "{{.}}",
  //         },
  //         selectionKey: "path",
  //         selectable: { $ref: "/$ui/folder/root/selectable" },
  //         selection: { $ref: "/$ui/folder/root/selection" },
  //         multiselectable: { $ref: "/$ui/folder/root/multiselectable" },
  //         items: [
  //           "/tests/fixtures/components/folder/subfolder/",
  //           "/tests/fixtures/components/folder/script.js",
  //           "/tests/fixtures/components/folder/style.css",
  //         ],
  //       },
  //     },
  //     icon: {
  //       "root,ui-folder,ui-grid,[0]": {
  //         small: undefined,
  //         label: true,
  //         path: { $ref: "/$ui/grid/root,ui-folder/items/0" },
  //       },
  //       "root,ui-folder,ui-grid,[1]": {
  //         small: undefined,
  //         label: true,
  //         path: { $ref: "/$ui/grid/root,ui-folder/items/1" },
  //       },
  //       "root,ui-folder,ui-grid,[2]": {
  //         small: undefined,
  //         label: true,
  //         path: { $ref: "/$ui/grid/root,ui-folder/items/2" },
  //       },
  //     },
  //   },
  // })

  const el = app.el.querySelector("ui-folder")
  const icons = t.puppet.$$$("ui-icon", { live: true, base: app.el })

  t.eq(el.selection, ["/tests/fixtures/components/folder/script.js"])

  t.eq(icons.textContent, [
    "subfolder\u200b", //
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

  el.currentView.selectable.selection.push(
    "/tests/fixtures/components/folder/style.css",
  )
  el.currentView.selectable.sync()

  t.eq(icons.getAttribute("aria-selected"), [
    "false", //
    "true",
    "true",
  ])

  el.currentView.selectable.setSelection([
    "/tests/fixtures/components/folder/subfolder/",
  ])
  await app

  t.eq(icons.getAttribute("aria-selected"), [
    "true", //
    "false",
    "false",
  ])

  el.path = "/tests/fixtures/components/folder/subfolder/"
  await app

  t.eq(icons.textContent, [
    "a\u200b",
    "b\u200b",
    "data\u200b.json",
    "file\u200b.txt",
  ])

  t.eq(el.selection, [])
  t.eq(el.currentView.selectable.selection, [])
})
