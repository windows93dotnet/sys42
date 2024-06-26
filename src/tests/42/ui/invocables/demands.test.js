import test from "../../../../42/test.js"
import { log } from "../../../../42/core/dev/testing/helpers/triggerOpener.js"

const manual = 0
const iframe = 1

const { href } = new URL(
  "../../../../demos/ui/invocables/demands.demo.html",
  import.meta.url,
)

test.utils.preload(href, { prefetch: true, catchError: true })

import prompt from "../../../../42/ui/invocables/prompt.js"
import alert from "../../../../42/ui/invocables/alert.js"
import confirm from "../../../../42/ui/invocables/confirm.js"

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
          }),
        )
      },
    },
    {
      tag: "button",
      label: "Error",
      id: "alertError",
      click() {
        log(alert(new TypeError("boom")))
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
            expanded: true,
            log: false,
          }),
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
          }),
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
          }),
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

test.ui(async (t, { triggerOpener }) => {
  await t.glovebox({ href, iframe }, makeContent)

  if (manual) {
    return t.pass()
  }

  await triggerOpener(
    "#prompt",
    ".ui-dialog__agree",
    "derp",
    async (dialog) => {
      const input = dialog.querySelector('[name="/value"]')
      t.true(
        window.top.document.activeElement === input,
        "Element should have focus",
      )
      await t.puppet(input).fill("derp")
    },
  )

  await triggerOpener(
    "#alertErrorCustom",
    ".ui-dialog__agree",
    true,
    async (dialog) => {
      t.match(dialog.querySelector("img").src, /error\./)
      const agree = dialog.querySelector(".ui-dialog__agree")
      const details = dialog.querySelector(".ui-dialog__details")
      t.is(
        dialog.querySelector(".ui-dialog-demand__content").textContent,
        "Oops",
      )
      t.match(
        dialog.querySelector(".ui-dialog-demand__error").textContent,
        /boom\n┌╴TypeError/,
      )
      t.is(details.getAttribute("aria-expanded"), "true")
      t.true(
        window.top.document.activeElement === agree,
        "Alert agree button should have focus",
      )
    },
  )

  await Promise.all([
    // alert always return true
    triggerOpener("#alert", ".ui-dialog__agree", true),
    triggerOpener("#alert", ".ui-dialog__close", true),

    // confirm return a boolean
    triggerOpener("#confirm", ".ui-dialog__agree", true),
    triggerOpener("#confirm", ".ui-dialog__decline", false),
    triggerOpener("#confirm", ".ui-dialog__close", false),

    // prompt return a string or undefined
    triggerOpener("#prompt", ".ui-dialog__agree", ""),
    triggerOpener("#prompt", ".ui-dialog__decline", undefined),
    triggerOpener("#prompt", ".ui-dialog__close", undefined),

    // Customs
    // -------
    triggerOpener("#alertCustom", ".ui-dialog__agree", true, async (dialog) => {
      t.match(dialog.querySelector("img").src, /warning\./)
      t.is(dialog.querySelector(".ui-dialog__agree").textContent, "Fine !")
    }),

    triggerOpener("#confirmCustom", ".ui-dialog__agree", true, (dialog) => {
      t.match(dialog.querySelector("img").src, /question\./)
      t.is(dialog.querySelector(".ui-dialog__agree").textContent, "Yep")
      t.is(dialog.querySelector(".ui-dialog__decline").textContent, "Nope")
      t.is(dialog.querySelector(".ui-dialog__agree ui-picto").value, "check")
      t.is(dialog.querySelector(".ui-dialog__decline ui-picto").value, "cross")
    }),

    triggerOpener("#promptCustom", ".ui-dialog__agree", "42", (dialog) => {
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

    triggerOpener(
      "#promptAutoTextarea",
      ".ui-dialog__agree",
      "derp",
      async (dialog) => {
        const input = dialog.querySelector('[name="/value"]')
        t.is(input.localName, "textarea")
        await t.puppet(input).fill("derp")
      },
    ),
  ])
})
