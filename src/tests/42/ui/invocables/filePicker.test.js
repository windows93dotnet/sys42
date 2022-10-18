import test from "../../../../42/test.js"
import { make, launch, log, preload } from "./helpers.js"

const manual = 0

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
      async click() {
        log(await explorer())
      },
    },
    "\n\n",
    "\n\n",
    {
      tag: "button",
      label: "File Picker Open",
      id: "filePickerOpen",
      async click() {
        log(await filePicker.open())
      },
    },
    {
      tag: "button",
      label: "File Picker Open Path",
      id: "filePickerOpenPath",
      async click() {
        log(await filePicker.open("/tests/fixtures/website/index.html"))
      },
    },
    "\n\n",
    {
      tag: "button",
      label: "File Picker Save",
      id: "filePickerSave",
      async click() {
        log(await filePicker.save())
      },
    },
    {
      tag: "button",
      label: "File Picker Save Content",
      id: "filePickerSaveContent",
      async click() {
        log(await filePicker.save("/hello.txt", "hello world"))
      },
    },
  ],
})

test.ui(async (t) => {
  await make(t, { href, makeContent })
  if (manual) return t.pass()

  t.eq(await launch(t, "#filePickerOpen", ".dialog__decline"), undefined)
  t.eq(await launch(t, "#filePickerOpen", ".ui-dialog__close"), undefined)

  const styleFile = await fs.open("/style.css")

  t.eq(
    await launch(t, "#filePickerOpen", ".dialog__agree", async (dialog) => {
      t.is(t.puppet.$(".dialog__agree", dialog).disabled, true)
      await t.puppet('[path="/style.css"]', dialog).click()
      t.is(t.puppet.$(".dialog__agree", dialog).disabled, false)
    }),
    {
      path: "/",
      selection: ["/style.css"],
      files: [styleFile],
    }
  )
})
