import test from "../../../../42/test.js"
import { make, launch, log } from "./helpers.js"

const manual = 0

const { href } = new URL(
  "../../../../demos/ui/invocables/filePicker.demo.html?test=true",
  import.meta.url
)

import filePicker from "../../../../42/ui/invocables/filePicker.js"
import explorer from "../../../../42/ui/components/explorer.js"

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

  t.eq(await launch(t, "#filePickerOpen", ".dialog__agree"), {
    path: "/",
    selection: [],
    files: [],
  })
})
