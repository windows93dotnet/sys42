import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import inTop from "../../../../42/core/env/realm/inTop.js"
import "../../../../42/ui/components/dialog.js"
import "../../../../42/ui/popup.js"

const __ = inTop ? "Top" : "Iframe"

const makeMenu = (name) => [
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
          scope: "cnt",
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
    label: "Disabled",
    picto: "save",
    shortcut: "Ctrl+S",
    click: "{{save()}}",
    disabled: true,
  },
  {
    label: "Submenu",
    content: [
      {
        label: "{{cnt}}", //
        id: `submenuItemIncr${name}${__}`,
        picto: "plus-large",
        click: "{{cnt = incr(cnt)}}",
      },
    ],
  },
  "---",
  {
    label: "{{cnt}}", //
    id: `menuItemIncr${name}${__}`,
    picto: "plus-large",
    click: "{{cnt = incr(cnt)}}",
  },
]

const makeDemo = ({ content } = {}) => {
  content ??= [
    { tag: "number", scope: "cnt", compact: true },
    "\n\n",
    "\n\n",
    {
      tag: `button#btnIncr${__}.w-ctrl`,
      content: "{{cnt}}",
      click: "{{cnt++}}",
    },
    "---",
    { tag: "ui-menu", content: makeMenu("Inline") },
    "---",
    { tag: `button#btnMenu${__}`, content: "Menu", menu: makeMenu("Popup") },
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
      incr(n) {
        return n + 1
      },
    },
  }
}

if (inTop) {
  test.intg("dialog from closed popup is detached", async (t) => {
    const { decay, dest, when, $ } = t.utils

    const app = await decay(
      ui(dest(true), {
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

    t.puppet("#btnMenuTop").click()
    /* const { target: menu } = */ await when("uipopupopen")
    t.puppet("#menuItemDialogPopupTop").click()
    /* const { target: dialog } = */ await when("uidialogopen")
    await t.puppet().dispatch("blur") // close menu
    await t.puppet("#inputIncrDialogPopupTop").input(42)
    await app

    const els = {
      btnIncrTop: $.query("#btnIncrTop"),
      btnIncrDialogPopup: $.query("#btnIncrDialogPopupTop"),
      inputIncrDialogPopup: $.query("#inputIncrDialogPopupTop"),
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

  test.intg("top-level an iframe works the same", async (t) => {
    t.timeout(1000)
    const { decay, dest, when, $ } = t.utils

    const { href } = new URL(
      "../../../../demos/ui/components/menu.demo.html?test=true",
      import.meta.url
    )

    decay(
      await ui(
        dest(true),
        {
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
        },
        { trusted: true, id: "menuDemo" }
      )
    )

    const iframe = $.query("ui-sandbox iframe")

    await when("uipopupopen")
    t.puppet("#menuItemIncrPopupIframe").click()
    await iframe.contentWindow.sys42.once("ipc.plugin:end-of-update")

    t.is($.query("#btnIncrIframe", iframe).textContent, "1")
  })
} else {
  await ui({ content: makeDemo(), initiator: "menuDemo" })
  const { puppet } = test.utils
  puppet("#btnMenuIframe").click()
}
