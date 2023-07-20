import test from "../../../../42/test.js"

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
      id: "btnIncr",
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
                label: test.env.realm.inTop ? "Top" : "Iframe",
                content: [
                  {
                    tag: "button",
                    id: "btnDialogIncr",
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

test.ui(async (t, { makeRealmLab, triggerOpener, whenAllRealmReady }) => {
  window.app = await makeRealmLab(
    { href, iframe, syncData: true, nestedTestsParallel: true },
    makeContent,
  )

  await whenAllRealmReady()

  if (manual) return t.pass()

  /*  */
  await t.puppet("#btnIncr", window.app.el).click()
  t.pass()
  /*  */

  // const menuBtn = document.querySelector("#menu")
  // t.is(menuBtn.getAttribute("aria-expanded"), "false")
  // const menu = await triggerOpener(menuBtn)
  // t.is(menuBtn.getAttribute("aria-expanded"), "true")

  // const submenuBtn = menu.querySelector("#submenu")
  // t.is(submenuBtn.getAttribute("aria-expanded"), "false")
  // const submenu = await triggerOpener(submenuBtn)
  // t.is(submenuBtn.getAttribute("aria-expanded"), "true")

  // const dialog = await triggerOpener(submenu.querySelector("#dialog"))

  // await t.puppet("#btnDialogIncr", dialog).click()

  // await t.sleep(50)
  // await t.sleep(500)
  // t.is(submenuBtn.isConnected, false)
  // t.is(menuBtn.getAttribute("aria-expanded"), "false")

  // dialog.close()
})
