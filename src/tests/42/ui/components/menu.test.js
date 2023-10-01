import test from "../../../../42/test.js"

const manual = 1
const iframe = 0

const { href } = new URL(
  "../../../../demos/ui/components/menu.demo.html",
  import.meta.url,
)

test.utils.preload(href, { prefetch: true })

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
          label: "List",
          id: "list",
          items: [{ label: "A" }, { label: "B" }],
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

// test.ui(async (t, { makeRealmLab, triggerOpener }) => {
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

//   const menuBtn = document.querySelector("#menu")
//   t.is(menuBtn.getAttribute("aria-expanded"), "false")
//   const menu = await triggerOpener(menuBtn)

//   const list = menu.querySelector("li:has(#list)")
//   const submenu = menu.querySelector("li:has(#submenu)")

//   menu.triggerMenuitem(list)
//   // await t.sleep(10)
//   menu.triggerMenuitem(submenu)
// })

test.ui(async (t, { makeRealmLab, triggerOpener }) => {
  window.app = await makeRealmLab(
    {
      href,
      iframe,
      top: 1,
      syncData: true,
      nestedTestsParallel: true,
    },
    makeContent,
  )

  if (manual) return t.pass()

  if (test.env.realm.inIframe) await t.sleep(100) // TODO: find why this is needed

  const menuBtn = document.querySelector("#menu")
  t.is(menuBtn.getAttribute("aria-expanded"), "false")
  const menu = await triggerOpener(menuBtn)
  t.is(menuBtn.getAttribute("aria-expanded"), "true")

  const submenuBtn = menu.querySelector("#submenu")
  t.is(submenuBtn.getAttribute("aria-expanded"), "false")
  const submenu = await triggerOpener(submenuBtn)
  t.is(submenuBtn.getAttribute("aria-expanded"), "true")

  // Check that detached dialog is still using ipcPlugin
  const menuClosePromise = t.utils.untilClose(menu)
  const dialog = await triggerOpener(submenu.querySelector("#dialog"))
  await menuClosePromise
  await t.puppet("#btnDialogIncr", dialog).click()

  t.is(submenuBtn.getAttribute("aria-expanded"), "false")
  t.is(menuBtn.getAttribute("aria-expanded"), "false")

  dialog.close()

  if (test.env.realm.inIframe) {
    await t.sleep(50)
    t.is(t.puppet.$("#btnIncr").textContent, "2")
    t.is(t.puppet.$("#btnIncr", window.parent.document.body).textContent, "2")

    await t.puppet("#btnIncr", window.app.el).click()
    await t.sleep(50)
    t.is(t.puppet.$("#btnIncr").textContent, "3")
    t.is(t.puppet.$("#btnIncr", window.parent.document.body).textContent, "3")
  }
})
