import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import "../../../../42/ui/components/dialog.js"
import "../../../../42/ui/popup.js"
import inTop from "../../../../42/core/env/realm/inTop.js"

const makeMenu = (label) => [
  {
    label: `Dialog ${label}`,
    id: `menuItemDialog${label}`,
    picto: "folder-open",
    shortcut: "Ctrl+O",
    dialog: {
      label: `Dialog ${label}`,
      content: [
        {
          tag: `number#inputIncrDialog${label}`,
          scope: "cnt",
          compact: true,
        },
        {
          tag: `button#btnIncrDialog${label}`,
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
  "---",
  { picto: "plus-large", label: "{{cnt}}", click: "{{cnt = incr(cnt)}}" },
]

const makeDemo = (content) => {
  content ??= [
    { tag: "number", scope: "cnt", compact: true },
    "\n\n",
    "\n\n",
    {
      tag: "button#btnIncrTop.w-ctrl",
      content: "{{cnt}}",
      click: "{{cnt++}}",
    },
    "---",
    { tag: "ui-menu", content: makeMenu("Inline") },
    "---",
    { tag: "button#btnMenu", content: "Menu", menu: makeMenu("Popup") },
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
    const { collect, dest, when, $ } = t.utils

    const app = await collect(
      ui(
        dest(true),
        {
          tag: ".box-fit.desktop",
          content: {
            tag: ".box-v.w-full",
            content: [
              makeDemo([
                {
                  tag: "button#btnIncrTop.w-ctrl",
                  content: "{{cnt}}",
                  click: "{{cnt++}}",
                },
                "\n\n",
                {
                  tag: "button#btnMenu",
                  content: "Menu",
                  menu: makeMenu("Popup"),
                },
              ]),
            ],
          },
        },
        { trusted: true }
      )
    )

    t.puppet("#btnMenu").click()
    /* const { target: menu } = */ await when("uipopupopen")
    t.puppet("#menuItemDialogPopup").click()
    /* const { target: dialog } = */ await when("uidialogopen")
    await t.puppet().dispatch("blur") // close menu
    await t.puppet("#inputIncrDialogPopup").input(42)
    await app

    const els = {
      btnIncrTop: $.query("#btnIncrTop"),
      btnIncrDialogPopup: $.query("#btnIncrDialogPopup"),
      inputIncrDialogPopup: $.query("#inputIncrDialogPopup"),
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
    const { collect, dest } = t.utils

    const { href } = new URL(
      "../../../../demos/ui/components/menu.demo.html",
      import.meta.url
    )

    await collect(
      ui(
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
        { trusted: true }
      )
    )

    t.is(1, 1)
  })
} else {
  await ui(makeDemo())
  // puppet("#btnMenu").click()
  // puppet("#btnDialog").click()
}
