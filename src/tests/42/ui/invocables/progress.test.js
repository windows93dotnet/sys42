import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

import inTop from "../../../../42/core/env/realm/inTop.js"

import http from "../../../../42/core/http.js"
import stream from "../../../../42/core/stream.js"
import progress from "../../../../42/ui/invocables/progress.js"

// const manual = 0

// let res
// function log(arg) {
//   if (manual) console.log(arg)
//   else res = arg
// }

const { href } = new URL(
  "../../../../demos/ui/invocables/progress.demo.html?test=true",
  import.meta.url
)

const makeDemo = () => ({
  tag: ".w-full.pa-xl",
  content: [
    {
      tag: "button",
      label: "Progress",
      id: "progress",
      async click() {
        const p = progress(100, { _icon: "error" })
        const state = await p.state
        state.value = 30
        state.description = "0/1"
      },
    },
    {
      tag: "button",
      label: "Progress as TransformStream",
      id: "progressStream",
      async click() {
        http
          .source("../../tests/fixtures/stream/html_standard.html.gz", {
            cors: "no-cors",
          })
          .size((total, rs) => {
            rs.pipeThrough(stream.ts.cut(10_000))
              .pipeThrough(stream.ts.pressure(100))
              .pipeThrough(progress(total, { keep: !true }))
              .pipeTo(stream.ws.sink())
              .catch(() => {
                console.log("canceled pipeline")
              })
          })
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

    t.pass()
  })
} else {
  document.body.classList.add("debug")
  await ui({
    content: makeDemo(),
    initiator: "invocableDemo",
  })
}
