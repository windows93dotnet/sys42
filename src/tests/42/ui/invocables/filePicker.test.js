import test from "../../../../42/test.js"
import { make, launch, log, preload } from "./helpers.js"

const manual = 0
const iframe = 1

const { href } = new URL(
  "../../../../demos/ui/invocables/filePicker.demo.html?test=true",
  import.meta.url
)

preload(href, { prefetch: true })

import filePicker from "../../../../42/ui/invocables/filePicker.js"
import explorer from "../../../../42/ui/components/explorer.js"
import fs from "../../../../42/core/fs.js"

const makeContent = () => ({
  tag: ".w-full.pa-xl",
  content: [
    {
      tag: "button",
      label: "Explorer",
      id: "explorer",
      click() {
        log(explorer())
      },
    },
    "\n\n",
    "\n\n",
    {
      tag: "button",
      label: "File Picker Open",
      id: "filePickerOpen",
      click() {
        log(filePicker.open())
      },
    },
    {
      tag: "button",
      label: "File Picker Open Path",
      id: "filePickerOpenPath",
      click() {
        log(filePicker.open("/tests/fixtures/website/index.html"))
      },
    },
    "\n\n",
    {
      tag: "button",
      label: "File Picker Save",
      id: "filePickerSave",
      click() {
        log(filePicker.save())
      },
    },
    {
      tag: "button",
      label: "File Picker Save Content",
      id: "filePickerSaveContent",
      click() {
        log(filePicker.save("/hello.txt", "hello world"))
      },
    },
  ],
})

const filesPromise = Promise.all([
  fs.open("/style.css"),
  fs.open("/index.html"),
])

test.ui(async (t) => {
  await make(t, { href, makeContent }, iframe)
  if (manual) return t.pass()

  const files = await filesPromise

  await Promise.all([
    /* Open
    ======= */

    launch(t, "#filePickerOpen", ".ui-dialog__decline").then((res) =>
      t.is(res, undefined)
    ),

    launch(t, "#filePickerOpen", ".ui-dialog__close").then((res) =>
      t.is(res, undefined)
    ),

    launch(t, "#filePickerOpen", ".ui-dialog__agree", async (dialog) => {
      t.is(t.puppet.$(".ui-dialog__agree", dialog).disabled, true)
      await t.puppet('[path="/style.css"]', dialog).click()
      t.is(t.puppet.$(".ui-dialog__agree", dialog).disabled, false)
    }).then((res) => {
      t.eq(res, {
        path: "/",
        selection: ["/style.css"],
        files: [files[0]],
      })
    }),

    launch(t, "#filePickerOpen", ".ui-dialog__agree", async (dialog) => {
      await t
        .puppet('[path="/style.css"]', dialog)
        .click()
        .target('[path="/index.html"]', dialog)
        .keydown("Control")
        .click()
    }).then((res) => {
      t.eq(res, {
        path: "/",
        selection: ["/style.css", "/index.html"],
        files,
      })
    }),

    /* Save
    ======= */

    launch(t, "#filePickerSave", ".ui-dialog__close").then((res) => {
      t.is(res, undefined)
    }),

    launch(t, "#filePickerSave", ".ui-dialog__decline").then((res) => {
      t.is(res, undefined)
    }),

    launch(t, "#filePickerSave", ".ui-dialog__agree").then((res) => {
      t.eq(res, {
        saved: undefined,
        path: "/untitled.txt",
        dir: "/",
        base: "untitled.txt",
      })
    }),
  ])
})
