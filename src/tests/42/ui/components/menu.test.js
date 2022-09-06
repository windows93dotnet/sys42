import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import "../../../../42/ui/components/dialog.js"
import "../../../../42/ui/popup.js"
import inTop from "../../../../42/core/env/realm/inTop.js"

const content = (label) => [
  {
    label: `Dialog ${label}`,
    id: `menuItemDialog${label}`,
    picto: "folder-open",
    shortcut: "Ctrl+O",
    dialog: {
      label: `Dialog ${label}`,
      content: [
        {
          tag: "number",
          scope: "cnt",
          compact: true,
        },
        {
          tag: "button",
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

const demo = {
  tag: ".pa-xxl",
  content: [
    { tag: "number", scope: "cnt", compact: true },
    "\n\n",
    "\n\n",
    {
      tag: "button.w-ctrl",
      content: "{{cnt}}",
      click: "{{cnt++}}",
    },
    "---",
    { tag: "ui-menu", content: content("Inline") },
    "---",
    { tag: "button#btnMenu", content: "Menu", menu: content("Popup") },
  ],

  state: {
    cnt: 42,
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

if (inTop) {
  test.intg(async (t, { collect, dest, when }) => {
    await collect(
      ui(
        dest(true),
        {
          tag: ".box-fit.desktop",
          content: {
            tag: ".box-v.w-full",
            content: [
              demo,
              // {
              //   tag: "ui-sandbox.panel",
              //   permissions: "trusted",
              //   path: "./menu.demo.html",
              // },
            ],
          },
        },
        { trusted: true }
      )
    )

    t.puppet("#btnMenu").click()
    await when("uipopupopen")
    t.puppet("#menuItemDialogPopup").click()
    await when("uidialogopen")
    t.puppet(".ui-dialog__body input").input(5)
  })
} else {
  await ui(demo)
  // puppet("#btnMenu").click()
  // puppet("#btnDialog").click()
}
