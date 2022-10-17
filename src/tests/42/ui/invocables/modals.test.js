import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import inTop from "../../../../42/core/env/realm/inTop.js"

import prompt from "../../../../42/ui/invocables/prompt.js"
import alert from "../../../../42/ui/invocables/alert.js"
import confirm from "../../../../42/ui/invocables/confirm.js"

const manual = 1

let res
const undef = Symbol("undef")
function log(arg) {
  if (manual) console.log(inTop, arg)
  res = arg ?? undef
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

test.ui(async (t) => {
  // console.group("inTop", inTop)
  // console.log(t.utils.decay)
  // console.log(t.utils.dest)
  // console.groupEnd()

  await t.utils.decay(
    ui(
      // t.utils.dest({ connect: true }),
      {
        id: "invocableDemo",
        tag: ".box-fit.desktop",
        content: inTop
          ? {
              tag: ".box-v.size-full",
              content: [
                makeDemo(),
                {
                  tag: "ui-sandbox.panel",
                  permissions: "trusted",
                  path: href,
                },
              ],
            }
          : makeDemo(),
      },
      { trusted: true }
    )
  )

  await t.puppet("#alert").click().when("uidialogopen")
  await t.puppet(".dialog__agree").click().when("uidialogclose")
  t.is(res, true)

  // await t.puppet("#alert").click().when("uidialogopen")
  // await t.puppet(".ui-dialog__close").click().when("uidialogclose")
  // t.is(res, undef)
})

// if (inTop) {
//   test.ui(1, async (t) => {
//     const { decay, dest } = t.utils

//     await decay(
//       ui(
//         dest({ connect: true }),
//         {
//           id: "invocableDemo",
//           tag: ".box-fit.desktop",
//           content: {
//             tag: ".box-v.size-full",
//             content: [
//               makeDemo(),
//               {
//                 tag: "ui-sandbox.panel",
//                 permissions: "trusted",
//                 path: href,
//               },
//             ],
//           },
//         },
//         { trusted: true }
//       )
//     )

//     const iframe = t.puppet.$.query("iframe")

//     await test("alert agree", async (t) => {
//       await t.puppet("#alert").click().when("uidialogopen")
//       await t.puppet(".dialog__agree").click().when("uidialogclose")
//       await t.sleep(0)
//       t.is(res, true)
//     })

//     res = undefined

//     await test("alert agree", "iframe", async (t) => {
//       await t.puppet("#alert", iframe).click().when("uidialogopen")
//       await t.puppet(".dialog__agree").click().when("uidialogclose")
//       await t.sleep(0)
//       t.is(res, true)
//     })

//     res = undefined

//     await test("alert decline", async (t) => {
//       await t.puppet("#alert").click().when("uidialogopen")
//       await t.puppet(".ui-dialog__close").click().when("uidialogclose")
//       await t.sleep(0)
//       t.is(res, undef)
//     })

//     t.pass()
//   })
// } else {
//   document.body.classList.add("debug")

//   await ui({
//     content: makeDemo(),
//     initiator: "invocableDemo",
//   })
// }
