import test from "../../../../42/test.js"
import { make, launch, log, inTop } from "./helpers.js"

const manual = 1
const iframe = 0

const { href } = new URL(
  "../../../../demos/ui/invocables/demands.demo.html?test=true",
  import.meta.url
)

import prompt from "../../../../42/ui/invocables/prompt.js"
import alert from "../../../../42/ui/invocables/alert.js"
import confirm from "../../../../42/ui/invocables/confirm.js"

const err = new TypeError("boom")

const makeContent = () => ({
  tag: ".w-full.pa-xl",
  content: [
    {
      tag: "button",
      label: "Alert",
      id: "alert",
      click() {
        log(alert("Hello, alert"))
      },
    },
    {
      tag: "button",
      label: "Alert Custom",
      id: "alertCustom",
      click() {
        log(
          alert("Hello, alert", {
            label: "Yo",
            icon: "warning",
            agree: "Fine !",
          })
        )
      },
    },
    {
      tag: "button",
      label: "Error",
      id: "alertError",
      click() {
        log(alert(err))
      },
    },
    {
      tag: "button",
      label: "Error Custom",
      id: "alertErrorCustom",
      click() {
        log(
          alert(new TypeError("boom"), {
            content: "Oops",
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
      click() {
        log(confirm("Do you confirm ?"))
      },
    },
    {
      tag: "button",
      label: "Confirm Custom",
      id: "confirmCustom",
      click() {
        log(
          confirm("Do you confirm ?", {
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
      click() {
        log(prompt())
      },
    },
    {
      tag: "button",
      label: "Prompt Custom",
      id: "promptCustom",
      click() {
        log(
          prompt("What is the meaning of life,\nthe universe and everything?", {
            icon: "question",
            value: 42,
          })
        )
      },
    },
    {
      tag: "button",
      label: "Prompt auto textarea",
      id: "promptAutoTextarea",
      click() {
        log(prompt({ value: "A text\nwith newlines\n..." }))
      },
    },
  ],
})

test.ui(async (t) => {
  await make(t, { href, makeContent }, iframe)

  if (manual) {
    if (inTop) await t.puppet("#alert").click()
    return t.pass()
  }

  await Promise.all([
    // alert always return true
    launch(t, "#alert", ".ui-dialog__agree", true),
    launch(t, "#alert", ".ui-dialog__close", true),

    // confirm return a boolean
    launch(t, "#confirm", ".ui-dialog__agree", true),
    launch(t, "#confirm", ".ui-dialog__close", false),
    launch(t, "#confirm", ".ui-dialog__decline", false),

    // prompt return a string or undefined
    launch(t, "#prompt", ".ui-dialog__agree", ""),
    launch(t, "#prompt", ".ui-dialog__decline", undefined),
    launch(t, "#prompt", ".ui-dialog__close", undefined),

    launch(t, "#prompt", ".ui-dialog__agree", "derp", async (dialog) => {
      const input = dialog.querySelector('[name="/value"]')
      await t.puppet(input).fill("derp")
    }),

    // Customs
    // -------
    launch(t, "#alertCustom", ".ui-dialog__agree", true, async (dialog) => {
      t.match(dialog.querySelector("img").src, /warning\./)
      t.is(dialog.querySelector(".ui-dialog__agree").textContent, "Fine !")
    }),

    launch(t, "#confirmCustom", ".ui-dialog__agree", true, (dialog) => {
      t.match(dialog.querySelector("img").src, /question\./)
      t.is(dialog.querySelector(".ui-dialog__agree").textContent, "Yep")
      t.is(dialog.querySelector(".ui-dialog__decline").textContent, "Nope")
      t.is(dialog.querySelector(".ui-dialog__agree ui-picto").value, "check")
      t.is(dialog.querySelector(".ui-dialog__decline ui-picto").value, "cross")
    }),

    launch(t, "#promptCustom", ".ui-dialog__agree", "42", (dialog) => {
      t.match(dialog.querySelector("img").src, /question\./)
      t.is(dialog.querySelector(".ui-dialog__agree").textContent, "Ok")
      t.is(dialog.querySelector(".ui-dialog__decline").textContent, "Cancel")
      const label = dialog.querySelector("label")
      const input = dialog.querySelector('[name="/value"]')
      t.match(label.textContent, /What is the/)
      t.is(input.localName, "input")
      t.is(input.value, "42")
      t.is(label.htmlFor, input.id)
    }),

    launch(
      t,
      "#promptAutoTextarea",
      ".ui-dialog__agree",
      "derp",
      async (dialog) => {
        const input = dialog.querySelector('[name="/value"]')
        t.is(input.localName, "textarea")
        await t.puppet(input).fill("derp")
      }
    ),
  ])
})
