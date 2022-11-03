import test from "../../../../42/test.js"
import { make } from "../invocables/helpers.js"

const manual = 0
const iframe = 1

const { top } = globalThis

const { href } = new URL(
  "../../../../demos/ui/components/menu-popup.demo.html?test=true",
  import.meta.url
)

import "../../../../42/ui/popup.js"
import "../../../../42/ui/components/dialog.js"

const makeDialogButton = () => ({
  label: "Dialog",
  content: [{ tag: "number", bind: "cnt", compact: true }],
})
const makeContent = () => ({
  tag: ".w-full.pa-xl",
  content: [
    { tag: "number", bind: "cnt", compact: true },
    "<br>",
    "<br>",
    {
      tag: "button",
      id: "dialogBtn",
      label: "Dialog",
      dialog: makeDialogButton(),
    },
    "<br>",
    "<br>",
    {
      tag: "button",
      label: "Popup",
      id: "popupBtn",
      menu: [{ label: "Dialog", dialog: makeDialogButton() }],
    },
  ],

  state: {
    cnt: 0,
  },
})

test.ui(async (t) => {
  await make(t, { href, makeContent }, iframe)

  if (manual) return t.pass()

  await t.puppet("#dialogBtn").click()
  const { target } = await t.utils.when(top, "uidialogopen")
  await t.puppet('input[type="number"]', target).input(5)
  await t.puppet(".ui-dialog__close", target).click()
  t.is(t.puppet.$('input[type="number"]').value, "5")
})
