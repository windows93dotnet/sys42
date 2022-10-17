import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import inTop from "../../../../42/core/env/realm/inTop.js"
import "../../../../42/ui/components/dialog.js"
import "../../../../42/ui/popup.js"

const manual = 0

const __ = inTop ? "Top" : "Iframe"

const { href } = new URL(
  "../../../../demos/ui/components/menu.demo.html?test=true",
  import.meta.url
)

const { when } = test.utils

const makeMenu = (name) => {
  const submenu = [
    {
      label: "Infinite Submenu",
      get content() {
        return submenu
      },
    },
    {
      label: "Submenu",
      content: [
        {
          label: "Hello",
          click: '{{log("hello")}}',
        },
        {
          label: "World",
          click: '{{log("world")}}',
        },
      ],
    },
    "---",
    {
      label: "{{cnt}}", //
      picto: "plus-large",
      click: "{{cnt = incr(cnt)}}",
      // click: "{{cnt++}}",
    },
  ]

  return [
    {
      label: "Disabled",
      picto: "bolt",
      click: "{{save()}}",
      disabled: true,
    },
    {
      label: "Infinite Submenu",
      id: `menuItemSubmenu${name}${__}`,
      picto: "cog",
      content: submenu,
    },
    {
      label: "Submenu",
      id: `submenuItem3rd${name}${__}`,
      content: [
        {
          label: "Hello",
          click: '{{log("hello")}}',
        },
        {
          label: "World",
          click: '{{log("world")}}',
        },
      ],
    },
    "---",
    {
      label: `Dialog ${name}`,
      id: `menuItemDialog${name}${__}`,
      picto: "folder-open",
      shortcut: "Ctrl+O",
      dialog: {
        label: `Dialog ${name} ${__}`,
        content: [
          {
            tag: `number#inputIncrDialog${name}${__}`,
            watch: "cnt",
            compact: true,
          },
          {
            tag: `button#btnIncrDialog${name}${__}`,
            content: "{{cnt}}",
            click: "{{cnt++}}",
          },
        ],
      },
    },
    {
      label: "Save",
      picto: "save",
      shortcut: "Ctrl+S",
      click: "{{save()}}",
      disabled: true,
    },
    {
      label: "{{cnt}}", //
      id: `menuItemIncr${name}${__}`,
      picto: "plus-large",
      click: "{{cnt = incr(cnt)}}",
      // click: "{{cnt++}}",
    },
  ]
}

const makeDemo = ({ content } = {}) => {
  content ??= [
    { tag: "number", watch: "cnt", id: `cnt${__}`, compact: true },
    "\n\n",
    "\n\n",
    { tag: "ui-menubar", content: makeMenu("Inline") },
    "\n\n",
    { tag: "ui-menubar", content: makeMenu("Inline"), displayPicto: true },
    "\n\n",
    { tag: "number", watch: "cnt", compact: true },
    "\n\n",
    "\n\n",
    { tag: "ui-menu", content: makeMenu("Inline") },
    "\n\n",
    { tag: "number", watch: "cnt", compact: true },
    "\n\n",
    "\n\n",
    { tag: `button#btnMenu${__}`, content: "Menu", menu: makeMenu("Popup") },
    "\n\n",
    "\n\n",
    { tag: "number", watch: "cnt", compact: true },
    "\n\n",
    "\n\n",
    {
      tag: `button`,
      content: "Popup",
      popup: {
        tag: ".panel.outset.pa-lg",
        content: [
          `Hello popup`,
          "\n\n",
          { tag: "number", watch: "cnt", compact: true },
          "\n\n",
          { tag: "textarea", compact: true },
        ],
      },
    },
    "\n\n",
    "\n\n",
    { tag: "number", watch: "cnt", compact: true },
  ]

  return {
    tag: ".pa-xxl",
    content,

    state: {
      cnt: 0,
    },

    actions: {
      open() {
        console.log("open", inTop)
      },
      save() {
        console.log("save", inTop)
      },
      log(str) {
        console.log(str, inTop, this)
      },
      incr(n) {
        return n + 1
      },
    },
  }
}

if (inTop) {
  test.ui("dialog from closed popup is detached", async (t) => {
    const { decay, dest } = t.utils

    const app = await decay(
      ui(dest({ connect: true }), {
        tag: ".box-fit.desktop",
        content: {
          tag: ".box-v.w-full",
          content: [
            makeDemo({
              content: [
                {
                  tag: `button#btnIncr${__}.w-ctrl`,
                  content: "{{cnt}}",
                  click: "{{cnt++}}",
                },
                "\n\n",
                {
                  tag: `button#btnMenu${__}`,
                  content: "Menu",
                  menu: makeMenu("Popup"),
                },
              ],
            }),
          ],
        },
      })
    )

    await t.puppet("#btnMenuTop").click()
    await when("uipopupopen")
    await t.puppet("#menuItemDialogPopupTop").click()
    await when("uidialogopen")
    await t.puppet().dispatch("blur") // close menu
    await t.puppet("#inputIncrDialogPopupTop").input(42)
    await app

    const els = {
      btnIncrTop: t.puppet.$("#btnIncrTop"),
      btnIncrDialogPopup: t.puppet.$("#btnIncrDialogPopupTop"),
      inputIncrDialogPopup: t.puppet.$("#inputIncrDialogPopupTop"),
    }
    t.eq(
      [
        els.btnIncrTop.textContent,
        els.btnIncrDialogPopup.textContent,
        els.inputIncrDialogPopup.value,
      ],
      ["42", "42", "42"]
    )

    await t.puppet(els.btnIncrTop).click()
    await app

    t.eq(
      [
        els.btnIncrTop.textContent,
        els.btnIncrDialogPopup.textContent,
        els.inputIncrDialogPopup.value,
      ],
      ["43", "43", "43"]
    )
  })

  test.ui("submenu", async (t) => {
    t.timeout(3000)
    const { decay, dest } = t.utils

    decay(
      await ui(
        dest({ connect: true }),
        {
          id: "menuDemo",
          tag: ".box-fit.desktop",
          content: {
            tag: ".box-v.w-full",
            content: [
              makeDemo(),
              {
                tag: "ui-sandbox.panel",
                permissions: "trusted",
                path: href,
              },
            ],
          },
          plugins: ["autoIncrementId"],
        },
        { trusted: true }
      )
    )

    if (manual) {
      t.pass()
    } else {
      const iframe = t.puppet.$("ui-sandbox iframe")

      t.lap(await when("uipopupopen"))
      t.lap(await t.puppet("#menuItemIncrPopupIframe").click())
      t.lap(await iframe.contentWindow.sys42.once("ipc.plugin:end-of-update"))

      t.is(t.puppet.$("#cntIframe", iframe)?.value, "1")
    }
  })
} else {
  document.body.classList.add("debug")
  await ui({
    content: makeDemo(),
    initiator: "menuDemo",
    plugins: ["autoIncrementId"],
  })
  if (!manual) {
    const { puppet } = test.utils
    await puppet("#btnMenuIframe").click()
  }
}
