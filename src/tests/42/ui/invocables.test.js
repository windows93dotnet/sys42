import test from "../../../42/test.js"
import ui from "../../../42/ui.js"

import inTop from "../../../42/core/env/realm/inTop.js"
import "../../../42/ui/components/dialog.js"
import "../../../42/ui/popup.js"

import http from "../../../42/core/http.js"
import stream from "../../../42/core/stream.js"

import filePicker from "../../../42/ui/invocables/filePicker.js"
import prompt from "../../../42/ui/invocables/prompt.js"
import alert from "../../../42/ui/invocables/alert.js"
import confirm from "../../../42/ui/invocables/confirm.js"
import progress from "../../../42/ui/invocables/progress.js"
import explorer from "../../../42/ui/components/explorer.js"

const err = new TypeError("boom")

const manual = 0

// const __ = inTop ? "Top" : "Iframe"

// const { href } = new URL(
//   "../../../demos/ui/invocables.demo.html?test=true",
//   import.meta.url
// )

const makeDemo = () => [
  // {
  //   tag: "button",
  //   label: "Alert",
  //   id: "alert",
  //   async click() {
  //     console.log(await alert("Hello, alert"))
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "Alert with icon",
  //   id: "alertIcon",
  //   async click() {
  //     console.log(
  //       await alert("Hello, alert", { icon: "warning", agree: "Fine !" })
  //     )
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "Error",
  //   id: "alertError",
  //   async click() {
  //     console.log(await alert(err))
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "Error with custom message",
  //   id: "alertErrorCustom",
  //   async click() {
  //     console.log(
  //       await alert(new TypeError("boom"), {
  //         message: "Oops",
  //         collapsed: false,
  //       })
  //     )
  //   },
  // },
  // "\n\n",
  // "\n\n",
  // {
  //   tag: "button",
  //   label: "Confirm",
  //   id: "confirm",
  //   async click() {
  //     console.log(await confirm("Do you confirm ?"))
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "Confirm with icon and custom buttons",
  //   id: "confirmIcon",
  //   async click() {
  //     console.log(
  //       await confirm("Do you confirm ?", {
  //         icon: "question",
  //         agree: { picto: "check", content: "Yep" },
  //         decline: { picto: "cross", content: "Nope" },
  //       })
  //     )
  //   },
  // },
  // "\n\n",
  // "\n\n",
  // {
  //   tag: "button",
  //   label: "Prompt",
  //   id: "prompt",
  //   async click() {
  //     console.log(await prompt())
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "Prompt with icon",
  //   id: "promptIcon",
  //   async click() {
  //     console.log(
  //       await prompt(
  //         "What is the meaning of life,\nthe universe and everything?",
  //         { icon: "question", value: 42 }
  //       )
  //     )
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "Prompt auto textarea",
  //   id: "promptAutoTextarea",
  //   async click() {
  //     console.log(await prompt({ value: "A text\nwith newlines\n..." }))
  //   },
  // },
  // "\n\n",
  // "\n\n",
  // {
  //   tag: "button",
  //   label: "Progress",
  //   id: "progress",
  //   async click() {
  //     const p = progress(100, { _icon: "error" })
  //     const state = await p.state
  //     state.value = 30
  //     state.description = "0/1"
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "Progress as TransformStream",
  //   id: "progressStream",
  //   async click() {
  //     http
  //       .source("../../tests/fixtures/stream/html_standard.html.gz", {
  //         cors: "no-cors",
  //       })
  //       .size((total, rs) => {
  //         rs.pipeThrough(stream.ts.cut(10_000))
  //           .pipeThrough(stream.ts.pressure(100))
  //           .pipeThrough(progress(total, { keep: !true }))
  //           .pipeTo(stream.ws.sink())
  //           .catch(() => {
  //             console.log("canceled pipeline")
  //           })
  //       })
  //   },
  // },
  // "\n\n",
  // "\n\n",
  // {
  //   tag: "button",
  //   label: "Explorer",
  //   id: "explorer",
  //   async click() {
  //     console.log(await explorer())
  //   },
  // },
  // "\n\n",
  // "\n\n",
  // {
  //   tag: "button",
  //   label: "File Picker Open",
  //   id: "filePickerOpen",
  //   async click() {
  //     console.log(await filePicker.open())
  //   },
  // },
  // {
  //   tag: "button",
  //   label: "File Picker Open Path",
  //   id: "filePickerOpenPath",
  //   async click() {
  //     console.log(await filePicker.open("/tests/fixtures/website/index.html"))
  //   },
  // },
  // "\n\n",
  {
    tag: "button",
    label: "File Picker Save",
    id: "filePickerSave",
    async click() {
      console.log(await filePicker.save())
    },
  },
  // {
  //   tag: "button",
  //   label: 'File Picker Save with content "hello world"',
  //   id: "filePickerSaveContent",
  //   async click() {
  //     console.log(await filePicker.save("/hello.txt", "hello world"))
  //   },
  // },
]

if (inTop) {
  test.ui("dialog from closed popup is detached", async (t) => {
    const { decay, dest } = t.utils

    await decay(
      ui(dest({ connect: true }), {
        tag: ".box-fit.desktop.pa-xl",
        content: makeDemo(),
      })
    )

    await t.puppet("#filePickerSave").click()

    t.pass()
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
