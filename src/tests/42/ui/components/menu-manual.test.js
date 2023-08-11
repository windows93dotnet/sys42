// TODO: fix two level submenu in iframe

import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import inTop from "../../../../42/core/env/realm/inTop.js"
import "../../../../42/ui/components/dialog.js"
import "../../../../42/ui/popup.js"

const manual = 1

const __ = inTop ? "Top" : "Iframe"

const { href } = new URL(
  "../../../../demos/ui/components/menu-manual.demo.html?dev=true",
  import.meta.url,
)

const { when } = test.utils

const makeDialogMenuitem = (name) => ({
  label: `Dialog`,
  id: `menuItemDialog${name}${__}`,
  picto: "folder-open",
  shortcut: "Ctrl+O",
  dialog: {
    label: `Dialog ${name} ${__}`,
    content: [
      {
        tag: `number#inputIncrDialog${name}${__}`,
        bind: "cnt",
        compact: true,
      },
      {
        tag: `button#btnIncrDialog${name}${__}`,
        content: "{{cnt}}",
        click: "{{cnt++}}",
      },
    ],
  },
})

const makeSubmenu = (name) => [
  {
    label: "Hello",
    click: '{{log("hello")}}',
  },
  {
    label: "World",
    click: '{{log("world")}}',
  },
  makeDialogMenuitem(name),
]

const makeMenu = (name) => {
  const submenu = [
    {
      label: "Infinite Submenu",
      get items() {
        return submenu
      },
    },
    {
      label: "Submenu",
      items: makeSubmenu(name),
    },
    "---",
    {
      label: "{{cnt}}", //
      picto: "plus",
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
      label: "Infinite",
      id: `menuItemSubmenu${name}${__}`,
      picto: "cog",
      items: submenu,
    },
    {
      label: "Submenu",
      id: `submenuItem3rd${name}${__}`,
      items: makeSubmenu(name),
    },
    "---",
    makeDialogMenuitem(name),
    {
      label: "Save",
      picto: "save",
      shortcut: "Ctrl+S",
      click: "{{save()}}",
      disabled: true,
    },
    {
      label: "Checkbox",
      tag: "checkbox",
      bind: "bool",
    },
    {
      label: "Disabled Checkbox",
      tag: "checkbox",
      value: true,
      disabled: true,
    },
    "---",
    {
      tag: "radio",
      bind: "choice",
      value: "foo",
    },
    {
      tag: "radio",
      bind: "choice",
      value: "bar",
    },
    "---",
    {
      label: "{{cnt}}", //
      id: `menuItemIncr${name}${__}`,
      picto: "plus",
      click: "{{cnt = incr(cnt)}}",
      // click: "{{cnt++}}",
    },
  ]
}

const makeDemo = ({ content } = {}) => {
  content ??= [
    { tag: "number", bind: "cnt", id: `cnt${__}`, compact: true },
    "\n\n",
    { tag: "checkbox", bind: "bool", id: `bool${__}` },
    {
      tag: "radio",
      bind: "choice",
      value: "foo",
    },
    {
      tag: "radio",
      bind: "choice",
      value: "bar",
    },
    {
      tag: "radio",
      bind: "choice",
      value: "baz",
    },
    "\n\n",
    "\n\n",
    { tag: "ui-menubar", items: makeMenu("Inline") },
    "\n\n",
    { tag: "ui-menubar", items: makeMenu("Inline"), displayPicto: true },
    "\n\n",
    { tag: "number", bind: "cnt", compact: true },
    "\n\n",
    "\n\n",
    { tag: "ui-menu", items: makeMenu("Inline") },
    "\n\n",
    { tag: "number", bind: "cnt", compact: true },
    "\n\n",
    "\n\n",
    { tag: `button#btnMenu${__}`, content: "Menu", menu: makeMenu("Popup") },
    "\n\n",
    "\n\n",
    { tag: "number", bind: "cnt", compact: true },
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
          { tag: "number", bind: "cnt", compact: true },
          "\n\n",
          { tag: "textarea", compact: true },
        ],
      },
    },
    "\n\n",
    "\n\n",
    { tag: "number", bind: "cnt", compact: true },
  ]

  return {
    tag: ".pa-xxl",
    content,

    state: {
      cnt: 0,
    },

    actions: {
      open() {
        console.log("open", { inTop })
      },
      save() {
        console.log("save", { inTop })
      },
      log(str) {
        console.log(str, { inTop }, this)
      },
      incr(n) {
        // console.log("incr", inTop, this)
        return n + 1
      },
    },
  }
}

if (inTop) {
  test.ui.skip("dialog from closed popup is detached", async (t) => {
    const { decay, dest } = t.utils

    const app = await decay(
      ui(dest({ connect: true }), {
        tag: ".box-fit.desktop",
        content: {
          tag: ".box-h.w-full",
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
      }),
    )

    if (manual) return t.pass()

    await t.puppet("#btnMenuTop").click()

    // menu is open
    await when("uipopupopen")
    t.isElement(t.puppet.$("ui-menu"))

    await t.puppet("#menuItemDialogPopupTop").click()
    await when("uidialogopen")

    // menu is closed
    t.isNull(t.puppet.$("ui-menu"))

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
      ["42", "42", "42"],
    )

    await t.puppet(els.btnIncrTop).click()
    await app

    t.eq(
      [
        els.btnIncrTop.textContent,
        els.btnIncrDialogPopup.textContent,
        els.inputIncrDialogPopup.value,
      ],
      ["43", "43", "43"],
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
            tag: ".box-h.w-full",
            content: [
              makeDemo(),
              {
                tag: "ui-sandbox.inset.ground",
                permissions: "trusted",
                path: href,
              },
            ],
          },
          plugins: ["autoIncrementId"],
        },
        { trusted: true },
      ),
    )

    if (manual) return t.pass()

    const iframe = t.puppet.$("ui-sandbox iframe")

    t.lap(await when("uipopupopen"))
    t.lap(await t.puppet("#menuItemIncrPopupIframe").click())
    t.lap(await iframe.contentWindow.sys42.once("ipc.plugin:end-of-update"))

    t.is(t.puppet.$("#cntIframe", iframe)?.value, "1")

    // TODO: test two level menu in iframe
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
