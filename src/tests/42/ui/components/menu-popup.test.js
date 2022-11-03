import test from "../../../../42/test.js"
import { make, inTop } from "../invocables/helpers.js"

const manual = 1
const iframe = 1

const { href } = new URL(
  "../../../../demos/ui/components/menu-popup.demo.html?test=true",
  import.meta.url
)

import "../../../../42/ui/popup.js"

const makeContent = () => ({
  tag: ".w-full.pa-xl",
  content: [
    {
      tag: "button",
      label: "Alert",
      id: "menu1",
      menu: [
        { label: "Hello" }, //
        { label: "World" },
      ],
    },
    {
      tag: "button",
      label: "Alert",
      id: "menu2",
      menu: [
        { label: "Hello" }, //
        { label: "World" },
      ],
    },
  ],
})

test.ui(async (t) => {
  await make(t, { href, makeContent }, iframe)

  if (manual) {
    if (!inTop) await t.puppet("#menu1").click()
    return t.pass()
  }
})
