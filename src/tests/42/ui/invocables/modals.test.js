import test from "../../../../42/test.js"
import { make, launch, log } from "./helpers.js"

const manual = 0

const { href } = new URL(
  "../../../../demos/ui/invocables/modals.demo.html?test=true",
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
      async click() {
        log(await alert("Hello, alert"))
      },
    },
    {
      tag: "button",
      label: "Alert Custom",
      id: "alertCustom",
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
      label: "Error Custom",
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
      label: "Confirm Custom",
      id: "confirmCustom",
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
      label: "Prompt Custom",
      id: "promptCustom",
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

test.ui(async (t) => {
  await make(t, { href, makeContent })
  if (manual) return t.pass()

  // alert always return true

  t.is(await launch(t, "#alert", ".dialog__agree"), true)
  t.is(await launch(t, "#alert", ".ui-dialog__close"), true)

  // confirm return a boolean

  t.is(await launch(t, "#confirm", ".dialog__agree"), true)
  t.is(await launch(t, "#confirm", ".dialog__decline"), false)
  t.is(await launch(t, "#confirm", ".ui-dialog__close"), false)

  // prompt return a string or undefined

  t.is(await launch(t, "#prompt", ".dialog__agree"), "")
  t.is(await launch(t, "#prompt", ".dialog__decline"), undefined)
  t.is(await launch(t, "#prompt", ".ui-dialog__close"), undefined)

  t.is(
    await launch(t, "#prompt", ".dialog__agree", async (dialog) => {
      const input = dialog.querySelector('[name="/value"]')
      await t.puppet(input).fill("derp")
    }),
    "derp"
  )

  // Customs
  // -------
  t.is(
    await launch(t, "#alertCustom", ".dialog__agree", (dialog) => {
      t.match(dialog.querySelector("img").src, /warning\./)
      t.is(dialog.querySelector(".dialog__agree").textContent, "Fine !")
    }),
    true
  )

  t.is(
    await launch(t, "#confirmCustom", ".dialog__agree", (dialog) => {
      t.match(dialog.querySelector("img").src, /question\./)
      t.is(dialog.querySelector(".dialog__agree").textContent, "Yep")
      t.is(dialog.querySelector(".dialog__decline").textContent, "Nope")
      t.is(dialog.querySelector(".dialog__agree ui-picto").value, "check")
      t.is(dialog.querySelector(".dialog__decline ui-picto").value, "cross")
    }),
    true
  )

  t.is(
    await launch(t, "#promptCustom", ".dialog__agree", (dialog) => {
      t.match(dialog.querySelector("img").src, /question\./)
      t.is(dialog.querySelector(".dialog__agree").textContent, "Ok")
      t.is(dialog.querySelector(".dialog__decline").textContent, "Cancel")
      const label = dialog.querySelector("label")
      const input = dialog.querySelector('[name="/value"]')
      t.match(label.textContent, /What is the/)
      t.is(input.localName, "input")
      t.is(input.value, "42")
      t.is(label.htmlFor, input.id)
    }),
    "42"
  )

  t.is(
    await launch(t, "#promptAutoTextarea", ".dialog__agree", async (dialog) => {
      const input = dialog.querySelector('[name="/value"]')
      t.is(input.localName, "textarea")
      await t.puppet(input).fill("derp")
    }),
    "derp"
  )
})
