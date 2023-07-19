import test from "../../../../42/test.js"
import {
  makeRealm,
  openPopup,
  log,
  preload,
} from "../../../../42/core/dev/testing/helpers/openPopup.js"

const manual = 0
const iframe = 1

const { href } = new URL(
  "../../../../demos/ui/invocables/filePicker.demo.html",
  import.meta.url,
)

preload(href, { prefetch: true })

import filePicker from "../../../../42/ui/invocables/filePicker.js"
import explorer from "../../../../42/ui/components/explorer.js"
import fs from "../../../../42/core/fs.js"
import idle from "../../../../42/fabric/type/promise/idle.js"

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
  t.timeout(6000)
  await makeRealm(t, { href, iframe }, makeContent)
  if (manual) return t.pass()

  const files = await filesPromise

  await Promise.all([
    /* Open
    ======= */

    openPopup(t, "#filePickerOpen", ".ui-dialog__close", { ok: false }),
    openPopup(t, "#filePickerOpen", ".ui-dialog__decline", { ok: false }),
    openPopup(
      t,
      "#filePickerOpen",
      ".ui-dialog__agree",
      {
        ok: true,
        dir: "/",
        selection: ["/style.css"],
        files: [files[0]],
      },
      async (dialog) => {
        t.is(t.puppet.$(".ui-dialog__agree", dialog).disabled, true)
        await t.puppet('[path="/style.css"]', dialog).click()
        t.is(t.puppet.$(".ui-dialog__agree", dialog).disabled, false)
      },
    ),
    openPopup(
      t,
      "#filePickerOpen",
      ".ui-dialog__agree",
      {
        ok: true,
        dir: "/",
        selection: ["/style.css", "/index.html"],
        files,
      },
      async (dialog) => {
        await t
          .puppet('[path="/style.css"]', dialog)
          .click()
          .target('[path="/index.html"]', dialog)
          .keydown("Control")
          .click()
      },
    ),
    openPopup(
      t,
      "#filePickerOpen",
      false,
      {
        ok: true,
        dir: "/",
        selection: ["/style.css"],
        files: [files[0]],
      },
      async (dialog) => {
        await t.puppet('[path="/style.css"]', dialog).dblclick()
        return false
      },
    ),
  ])

  t.timeout("reset")

  await Promise.all([
    // /* Save
    // ======= */

    openPopup(t, "#filePickerSave", ".ui-dialog__close", { ok: false }),
    openPopup(t, "#filePickerSave", ".ui-dialog__decline", { ok: false }),
    openPopup(t, "#filePickerSave", ".ui-dialog__agree", {
      ok: true,
      path: "/untitled.txt",
      // dir: "/",
      // base: "untitled.txt",
    }),
    openPopup(
      t,
      "#filePickerSave",
      ".ui-dialog__agree",
      {
        ok: true,
        path: "/style.css",
        // dir: "/",
        // base: "style.css",
      },
      async (dialog) => {
        await t.puppet('[path="/style.css"]', dialog).click()
        await idle()
      },
    ),

    openPopup(t, "#filePickerSaveContent", ".ui-dialog__close", { ok: false }),
    openPopup(t, "#filePickerSaveContent", ".ui-dialog__decline", {
      ok: false,
    }),
  ])

  await openPopup(
    t,
    "#filePickerSaveContent",
    ".ui-dialog__agree",
    {
      ok: true,
      saved: true,
      path: "/hello.txt",
      // dir: "/",
      // base: "hello.txt",
    },
    async (dialog) => {
      await t.sleep(100) // TODO: remove this
      t.is(dialog.querySelector('[name$="/name"]').value, "hello.txt")
    },
  )
    .then(async () => {
      t.is(await fs.readText("/hello.txt"), "hello world")
    })
    .finally(async () => {
      try {
        await fs.delete("/hello.txt")
      } catch (err) {
        console.error(err.message)
      }
    })
})
