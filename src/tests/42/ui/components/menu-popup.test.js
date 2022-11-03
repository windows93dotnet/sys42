import test from "../../../../42/test.js"
import system from "../../../../42/system.js"
import { make, inTop, launch } from "../invocables/helpers.js"

const manual = 0
const iframe = 1

// const { top } = globalThis

const { href } = new URL(
  "../../../../demos/ui/components/menu-popup.demo.html?test=true",
  import.meta.url
)

import "../../../../42/ui/popup.js"
import "../../../../42/ui/components/dialog.js"

const makeDialogButton = () => ({
  label: `Dialog ${inTop ? "Top" : "Iframe"}`,
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

  // if (inTop) return t.pass()

  if (manual) return t.pass()

  await launch(t, "#dialogBtn", ".ui-dialog__close", async (dialog) => {
    await t.puppet('input[type="number"]', dialog).input(5)
  })

  if (!inTop) await system.once("ipc.plugin:end-of-update")

  t.is(t.puppet.$('input[type="number"]').value, "5")
})
