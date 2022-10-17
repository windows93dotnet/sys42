import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import inTop from "../../../../42/core/env/realm/inTop.js"

import prompt from "../../../../42/ui/invocables/prompt.js"
import alert from "../../../../42/ui/invocables/alert.js"
import confirm from "../../../../42/ui/invocables/confirm.js"

const manual = 0

let res
const undef = Symbol("undef")
function log(arg) {
  if (manual) log(arg)
  else res = arg ?? undef
}

const { href } = new URL(
  "../../../../demos/ui/invocables/modals.demo.html?test=true",
  import.meta.url
)

const err = new TypeError("boom")

const makeDemo = () => ({
  tag: ".w-full.pa-xl",
  content: [
    {
      tag: "button",
      label: "Alert",
      id: "alert",
      async click() {
        log(await alert("Hello, alert"))
      },
    },
    {
      tag: "button",
      label: "Alert with icon",
      id: "alertIcon",
      async click() {
        log(await alert("Hello, alert", { icon: "warning", agree: "Fine !" }))
      },
    },
    {
      tag: "button",
      label: "Error",
      id: "alertError",
      async click() {
        log(await alert(err))
      },
    },
    {
      tag: "button",
      label: "Error with custom message",
      id: "alertErrorCustom",
      async click() {
        log(
          await alert(new TypeError("boom"), {
            message: "Oops",
            collapsed: false,
          })
        )
      },
    },
    "\n\n",
    "\n\n",
    {
      tag: "button",
      label: "Confirm",
      id: "confirm",
      async click() {
        log(await confirm("Do you confirm ?"))
      },
    },
    {
      tag: "button",
      label: "Confirm with icon and custom buttons",
      id: "confirmIcon",
      async click() {
        log(
          await confirm("Do you confirm ?", {
            icon: "question",
            agree: { picto: "check", content: "Yep" },
            decline: { picto: "cross", content: "Nope" },
          })
        )
      },
    },
    "\n\n",
    "\n\n",
    {
      tag: "button",
      label: "Prompt",
      id: "prompt",
      async click() {
        log(await prompt())
      },
    },
    {
      tag: "button",
      label: "Prompt with icon",
      id: "promptIcon",
      async click() {
        log(
          await prompt(
            "What is the meaning of life,\nthe universe and everything?",
            { icon: "question", value: 42 }
          )
        )
      },
    },
    {
      tag: "button",
      label: "Prompt auto textarea",
      id: "promptAutoTextarea",
      async click() {
        log(await prompt({ value: "A text\nwith newlines\n..." }))
      },
    },
  ],
})

if (inTop) {
  test.ui(1, async (t) => {
    const { decay, dest } = t.utils

    await decay(
      ui(
        dest({ connect: true }),
        {
          id: "invocableDemo",
          tag: ".box-fit.desktop",
          content: {
            tag: ".box-v.size-full",
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

    await t.puppet("#alert").click().when("uidialogopen")
    await t.puppet(".dialog__agree").click().when("uidialogclose")
    t.is(res, true)

    await t.puppet("#alert").click().when("uidialogopen")
    await t.puppet(".ui-dialog__close").click().when("uidialogclose")
    t.is(res, undef)
  })
} else {
  document.body.classList.add("debug")

  await ui({
    content: makeDemo(),
    initiator: "invocableDemo",
  })

  test(1, (t) => {
    t.is(1, 2)
  })
}
