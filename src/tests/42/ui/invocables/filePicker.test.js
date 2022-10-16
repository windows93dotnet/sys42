import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import inTop from "../../../../42/core/env/realm/inTop.js"

import filePicker from "../../../../42/ui/invocables/filePicker.js"
import explorer from "../../../../42/ui/components/explorer.js"

const manual = 0

let res
const undef = Symbol("undef")
function log(arg) {
  if (manual) log(arg)
  else res = arg ?? undef
}

const { href } = new URL(
  "../../../../demos/ui/invocables/filePicker.demo.html?test=true",
  import.meta.url
)

const makeDemo = () => ({
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
      label: 'File Picker Save with content "hello world"',
      id: "filePickerSaveContent",
      async click() {
        log(await filePicker.save("/hello.txt", "hello world"))
      },
    },
  ],
})

if (inTop) {
  test.ui(1, async (t) => {
    const { decay, dest } = t.utils

    await decay(
      ui(
        dest({ connect: true }),
        {
          id: "invocableDemo",
          tag: ".box-fit.desktop",
          content: {
            tag: ".box-v.size-full",
            content: [
              makeDemo(),
              {
                tag: "ui-sandbox.panel",
                permissions: "trusted",
                path: href,
              },
            ],
          },
        },
        { trusted: true }
      )
    )

    await t.puppet("#filePickerSave").click().when("uidialogopen")
    await t.puppet(".dialog__agree").click().when("uidialogclose")
    await t.sleep(0)
    t.eq(res, {
      saved: undefined,
      path: "/untitled.txt",
      dir: "/",
      base: "untitled.txt",
    })
  })
} else {
  document.body.classList.add("debug")
  await ui({
    content: makeDemo(),
    initiator: "invocableDemo",
  })
}
