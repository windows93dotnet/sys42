import test from "../../../../42/test.js"
import system from "../../../../42/system.js"
import ipc from "../../../../42/core/ipc.js"
import { closeAll } from "../../../../42/ui/popup.js"

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
  const { triggerOpener } = t.utils

  await t.glovebox({
    href,
    iframe: true,
    top: true,
    makeContent,
  })

  const menuTrigger = document.querySelector("#menuTrigger")
  t.is(menuTrigger.getAttribute("aria-expanded"), "false")

  const menu = await triggerOpener(menuTrigger)

  const listTrigger = menu.querySelector("#listTrigger")
  const submenuTrigger = menu.querySelector("#submenuTrigger")
  menu.triggerMenuitem(listTrigger)
  menu.triggerMenuitem(submenuTrigger)

  await new Promise((resolve) => {
    t.utils.on(window.top, {
      "ui:popup.close"({ target }) {
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
})

test.ui("detached dialog still use ipcPlugin", async (t) => {
  const { triggerOpener } = t.utils
  const { slug } = t.test

  const { app } = await t.glovebox({
    href,
    iframe: true,
    top: true,
    makeContent,
  })

  const deferred = t.utils.defer()

  if (test.env.realm.inIframe) {
    t.timeout("reset")
    await ipc.send(`42_MENU_TESTS_${slug}`)
    t.timeout("reset")
  } else {
    ipc.on(`42_MENU_TESTS_${slug}`, async () => deferred)
  }

  const menuTrigger = document.querySelector("#menuTrigger")
  t.is(menuTrigger.getAttribute("aria-expanded"), "false")
  const menu = t.step(await triggerOpener(menuTrigger))
  t.is(menuTrigger.getAttribute("aria-expanded"), "true")

  const submenuTrigger = menu.querySelector("#submenuTrigger")
  t.is(submenuTrigger.getAttribute("aria-expanded"), "false")
  const submenu = t.step(await triggerOpener(submenuTrigger))
  t.is(submenuTrigger.getAttribute("aria-expanded"), "true")

  // Check that detached dialog is still using ipcPlugin
  const menuClosePromise = t.utils.untilClose(menu)
  const dialog = t.step(
    await triggerOpener(submenu.querySelector("#dialogTrigger")),
  )
  t.step(await menuClosePromise)
  t.step(await t.puppet("#btnDialogIncr", dialog).click())

  if (test.env.realm.inIframe) {
    t.step(await system.once("ipc.plugin:end-of-update"))
  }

  t.timeout("reset")

  t.is(submenuTrigger.getAttribute("aria-expanded"), "false")
  t.is(menuTrigger.getAttribute("aria-expanded"), "false")

  deferred.resolve()

  if (test.env.realm.inIframe) {
    t.is(t.puppet.$("#btnIncr").textContent, "2")
    t.is(t.puppet.$("#btnIncr", window.parent.document.body).textContent, "2")

    t.step(await t.puppet("#btnIncr", app.el).click())
    t.step(await system.once("ipc.plugin:end-of-update"))

    t.is(t.puppet.$("#btnIncr").textContent, "3")
    t.is(t.puppet.$("#btnIncr", window.parent.document.body).textContent, "3")
  }

  dialog.close()
})

test.ui("menu opening close other menus's submenus", async (t) => {
  const makeItems = (n) => [
    {
      label: `submenu ${n}`,
      id: `submenuBtn${n}`,
      items: [
        { label: `submenu ${n} item 1` }, //
        { label: `submenu ${n} item 2` },
      ],
    },
  ]

  await t.glovebox({
    href,
    iframe: true,
    top: true,
    makeContent: () => ({
      tag: ".w-full.pa-xl",
      content: [
        { tag: "ui-menu#menu1", items: makeItems(1) },
        "<br>",
        { tag: "ui-menu#menu2", items: makeItems(2) },
      ],
    }),
  })

  const btn1 = document.querySelector("#submenuBtn1")
  const btn2 = document.querySelector("#submenuBtn2")

  const submenu1 = await t.utils.triggerOpener(btn1)
  t.is(btn1.getAttribute("aria-expanded"), "true")
  t.true(submenu1.isConnected)

  const submenu2 = await t.utils.triggerOpener(btn2)
  t.is(btn2.getAttribute("aria-expanded"), "true")
  t.true(submenu2.isConnected)

  t.is(btn1.getAttribute("aria-expanded"), "false")
  await t.utils.untilNextRepaint()
  t.false(submenu1.isConnected)
})

test.ui("menu initial expand", async (t) => {
  await t.glovebox({
    href,
    iframe: true,
    top: true,
    makeContent: () => ({
      tag: ".w-full.pa-xl",
      content: [
        {
          tag: "ui-menu#menu1",
          items: [
            {
              label: `submenu 1`,
              id: `submenuBtn1`,
              items: [
                { label: `submenu 1 item 1` }, //
                { label: `submenu 1 item 2` },
              ],
            },
            {
              label: `submenu 1`,
              id: `submenuBtn2`,
              items: [
                { label: `submenu 2 item 1` }, //
                { label: `submenu 2 item 2` },
              ],
            },
            {
              label: `disabled`,
              id: `disabledBtn`,
              disabled: true,
            },
          ],
        },
      ],
    }),
  })

  const submenuBtn1 = document.querySelector("#submenuBtn1")
  // const submenuBtn2 = document.querySelector("#submenuBtn2")
  // const disabledBtn = document.querySelector("#disabledBtn")

  const promise = new Promise((resolve) => {
    t.utils.on(submenuBtn1, {
      "ui:trigger-submenu"() {
        resolve(true)
      },
    })
  })

  t.puppet(submenuBtn1).hover().run()
  const res = await Promise.race([promise, t.sleep(100)])
  t.isUndefined(res, "Hover should not trigger submenu")

  t.puppet(submenuBtn1).click().run()
  const submenu1 = await t.utils.untilOpen(submenuBtn1)
  t.element.isConnected(submenu1)

  t.pass()
})
