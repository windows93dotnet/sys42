import test from "../../../../42/test.js"
import { make, launch, log } from "./helpers.js"

const manual = 0

const { href } = new URL(
  "../../../../demos/ui/invocables/progress.demo.html?test=true",
  import.meta.url
)

import http from "../../../../42/core/http.js"
import stream from "../../../../42/core/stream.js"
import progress from "../../../../42/ui/invocables/progress.js"

const makeContent = () => ({
  tag: ".w-full.pa-xl",
  content: [
    {
      tag: "button",
      label: "Progress",
      id: "progress",
      click() {
        const p = progress(100, { _icon: "error" })
        p.state.then((state) => {
          state.value = 30
          state.description = "0/1"
        })
        log(p.done)
      },
    },
    {
      tag: "button",
      label: "Progress as TransformStream",
      id: "progressStream",
      async click() {
        http
          .source("/tests/fixtures/stream/html_standard.html.gz", {
            cors: "no-cors",
          })
          .size((total, rs) => {
            rs.pipeThrough(stream.ts.cut(10_000))
              .pipeThrough(stream.ts.pressure(100))
              .pipeThrough(progress(total, { keep: !true }))
              .pipeTo(stream.ws.sink())
              .then(() => {
                log("closed pipeline")
              })
              .catch(() => {
                log("canceled pipeline")
              })
          })
      },
    },
  ],
})

test.ui(async (t) => {
  await make(t, { href, makeContent })

  if (manual) return t.pass()

  await launch(t, "#progress", ".ui-dialog__decline", {
    value: 30,
    label: "Progress",
    description: "0/1",
  })
})
