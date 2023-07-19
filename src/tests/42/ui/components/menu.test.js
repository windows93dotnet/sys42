import test from "../../../../42/test.js"
import {
  makeRealm,
  openPopup,
  inTop,
} from "../../../../42/core/dev/testing/helpers/openPopup.js"

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
  await makeRealm(t, { href, iframe, sync: !false }, makeContent)

  if (manual) return t.pass()

  const menuBtn = document.querySelector("#menu")
  t.is(menuBtn.getAttribute("aria-expanded"), "false")
  const menu = await openPopup(t, menuBtn)
  t.is(menuBtn.getAttribute("aria-expanded"), "true")

  const submenuBtn = menu.querySelector("#submenu")
  t.is(submenuBtn.getAttribute("aria-expanded"), "false")
  const submenu = await openPopup(t, submenuBtn)
  t.is(submenuBtn.getAttribute("aria-expanded"), "true")

  const dialog = await openPopup(t, submenu.querySelector("#dialog"))

  await t.sleep(50)
  t.is(submenuBtn.isConnected, false)
  t.is(menuBtn.getAttribute("aria-expanded"), "false")

  dialog.close()
})
