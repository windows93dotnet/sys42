import test from "../../../../42/test.js"
import { closeAll } from "../../../../42/ui/popup.js"

const manual = 0
const iframe = 1

const { href } = new URL(
  "../../../../demos/ui/components/menu.demo.html",
  import.meta.url,
)

test.utils.preload(href, { prefetch: true, catchError: true })

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
      id: "menuTrigger",
      menu: [
        {
          label: "{{cnt}}", //
          picto: "plus",
          click: "{{cnt++}}",
          id: "counter",
        },
        {
          label: "List",
          id: "listTrigger",
          // class: test.env.realm.inTop ? "Top" : "Iframe",
          items: [{ label: "A" }, { label: "B" }],
        },
        {
          label: "Submenu",
          id: "submenuTrigger",
          items: [
            {
              label: "Dialog",
              id: "dialogTrigger",
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

test.ui("submenu close previous submenu", async (t) => {
  const { makeRealmLab, triggerOpener } = t.utils

  window.app = await makeRealmLab(
    {
      href,
      iframe,
      top: 1,
    },
    makeContent,
  )

  // if (manual && test.env.realm.inTop) return t.pass()
  // if (manual) return t.pass()
  // if (test.env.realm.inTop) return t.pass()

  const menuTrigger = document.querySelector("#menuTrigger")
  t.is(menuTrigger.getAttribute("aria-expanded"), "false")

  const menu = await triggerOpener(menuTrigger)

  const listTrigger = menu.querySelector("#listTrigger")
  const submenuTrigger = menu.querySelector("#submenuTrigger")
  menu.triggerMenuitem(listTrigger)
  menu.triggerMenuitem(submenuTrigger)

  await new Promise((resolve) => {
    t.utils.on(window.top, {
      uipopupclose({ target }) {
        if (target.opener === "listTrigger") resolve()
      },
    })
  })

  const listMenu = top.document.querySelector(
    'ui-menu[aria-labelledby="listTrigger"]',
  )
  const submenuMenu = top.document.querySelector(
    'ui-menu[aria-labelledby="submenuTrigger"]',
  )

  t.isNull(listMenu)
  t.isElement(submenuMenu)

  t.is(submenuTrigger.getAttribute("aria-expanded"), "true")
  t.is(listTrigger.getAttribute("aria-expanded"), "false")

  if (test.env.realm.inTop) closeAll()
  else await t.sleep(100)
})

// test.ui("detached dialog still use ipcPlugin", async (t) => {
//   const { makeRealmLab, triggerOpener } = t.utils

//   window.app = await makeRealmLab(
//     {
//       href,
//       iframe,
//       top: 1,
//       syncData: true,
//       nestedTestsParallel: true,
//     },
//     makeContent,
//   )

//   if (manual) return t.pass()

//   if (test.env.realm.inIframe) await t.sleep(100) // TODO: find why this is needed

//   const menuTrigger = document.querySelector("#menuTrigger")
//   t.is(menuTrigger.getAttribute("aria-expanded"), "false")
//   const menu = t.step(await triggerOpener(menuTrigger))
//   t.is(menuTrigger.getAttribute("aria-expanded"), "true")

//   const submenuTrigger = menu.querySelector("#submenuTrigger")
//   t.is(submenuTrigger.getAttribute("aria-expanded"), "false")
//   const submenu = t.step(await triggerOpener(submenuTrigger))
//   t.is(submenuTrigger.getAttribute("aria-expanded"), "true")

//   // Check that detached dialog is still using ipcPlugin
//   const menuClosePromise = t.utils.untilClose(menu)
//   const dialog = t.step(
//     await triggerOpener(submenu.querySelector("#dialogTrigger")),
//   )
//   t.step(await menuClosePromise)
//   t.step(await t.puppet("#btnDialogIncr", dialog).click())

//   t.is(submenuTrigger.getAttribute("aria-expanded"), "false")
//   t.is(menuTrigger.getAttribute("aria-expanded"), "false")

//   dialog.close()

//   if (test.env.realm.inIframe) {
//     await t.sleep(50)
//     t.is(t.puppet.$("#btnIncr").textContent, "2")
//     t.is(t.puppet.$("#btnIncr", window.parent.document.body).textContent, "2")

//     await t.puppet("#btnIncr", window.app.el).click()
//     await t.sleep(50)
//     t.is(t.puppet.$("#btnIncr").textContent, "3")
//     t.is(t.puppet.$("#btnIncr", window.parent.document.body).textContent, "3")
//   }
// })
