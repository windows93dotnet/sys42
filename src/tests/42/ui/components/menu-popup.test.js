import test from "../../../../42/test.js"
import { make, inTop } from "../invocables/helpers.js"

const manual = 1
const iframe = 1

const { href } = new URL(
  "../../../../demos/ui/components/menu-popup.demo.html?test=true",
  import.meta.url
)

import "../../../../42/ui/popup.js"

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
    { tag: "button", label: "Dialog", dialog: makeDialogButton() },
    "<br>",
    "<br>",
    {
      tag: "button",
      label: "Alert",
      id: "menu1",
      menu: [
        { label: "Hello" },
        { label: "World" },
        { label: "Dialog", dialog: makeDialogButton() },
      ],
    },
  ],

  state: {
    cnt: 0,
  },
})

test.ui(async (t) => {
  await make(t, { href, makeContent }, iframe)

  if (manual) {
    if (inTop) await t.puppet("#menu1").click()
    return t.pass()
  }
})
