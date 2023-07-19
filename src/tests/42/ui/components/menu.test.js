import test from "../../../../42/test.js"
import { make, launch, inTop } from "../invocables/helpers.js"

const manual = 0
const iframe = 1

const { href } = new URL(
  "../../../../demos/ui/components/menu.demo.html",
  import.meta.url,
)

const makeContent = () => ({
  tag: ".w-full.pa-xl",
  content: [
    {
      tag: "button",
      label: "{{cnt}}", //
      picto: "plus",
      click: "{{cnt++}}",
    },
    "---",
    {
      tag: "button",
      label: "Menu",
      id: "menu",
      menu: [
        {
          label: "{{cnt}}", //
          picto: "plus",
          click: "{{cnt++}}",
        },
        {
          label: "Submenu",
          id: "submenu",
          items: [
            {
              label: "Dialog",
              id: "dialog",
              dialog: {
                label: inTop ? "Top" : "Iframe",
                content: [
                  {
                    tag: "button",
                    label: "{{cnt}}", //
                    picto: "plus",
                    click: "{{cnt++}}",
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  state: {
    cnt: 0,
  },
})

test.ui(async (t) => {
  const app = await make(t, { href, makeContent, iframe, sync: !false })

  if (manual) return t.pass()

  const menuBtn = document.querySelector("#menu")
  t.is(menuBtn.getAttribute("aria-expanded"), "false")
  const menu = await launch(t, menuBtn)
  t.is(menuBtn.getAttribute("aria-expanded"), "true")

  const submenuBtn = menu.querySelector("#submenu")
  t.is(submenuBtn.getAttribute("aria-expanded"), "false")
  const submenu = await launch(t, submenuBtn)
  t.is(submenuBtn.getAttribute("aria-expanded"), "true")

  const dialog = await launch(t, submenu.querySelector("#dialog"))

  await t.sleep(50)
  t.is(submenuBtn.isConnected, false)
  t.is(menuBtn.getAttribute("aria-expanded"), "false")

  dialog.close()
})
