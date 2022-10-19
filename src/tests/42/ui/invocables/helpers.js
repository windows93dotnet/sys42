import ui from "../../../../42/ui.js"
import system from "../../../../42/core/dev/testing/mainSystem.js"
import preload from "../../../../42/core/load/preload.js"
import inTop from "../../../../42/core/env/realm/inTop.js"
import listen from "../../../../42/fabric/event/listen.js"

let current = 0
const responses = new Map()
export function log(promise) {
  responses.set(current, promise)
  if (system.testing.manual) {
    Promise.all([import("../../../../42/core/log.js"), promise]).then(
      ([m, arg]) => m.default.inspect.async(arg)
    )
  }
}

const { top } = globalThis

export async function launch(t, open, close, fn) {
  const id = ++current
  const el = document.querySelector(open)
  const originalId = el.id
  const newId = originalId + id + inTop

  el.id = newId
  el.focus()
  el.click()
  el.id = originalId

  const res = responses.get(id)
  return new Promise((resolve) => {
    const forget = listen(top, {
      async uidialogopen({ target }) {
        if (target.opener === newId) {
          forget()
          const advance = await fn?.(target)
          if (advance === false || close === false) return resolve()
          t.puppet(close, target).click().run()
          resolve(res)
        }
      },
    })
  })
}

export async function make(t, { href, makeContent }, iframe = true) {
  const app = await t.utils.decay(
    ui(
      t.utils.dest({ connect: true }),
      {
        tag: inTop ? ".box-fit.desktop" : ".box-fit",
        content: inTop
          ? {
              tag: ".box-v.size-full",
              content: [
                makeContent(),
                iframe && {
                  // tag: "ui-sandbox.ground",
                  // permissions: "trusted",
                  // path: href,
                  tag: "iframe.ground",
                  src: href,
                },
              ],
            }
          : makeContent(),
      },
      { trusted: true }
    )
  )

  return app
}

export default {
  preload,
  launch,
  make,
  log,
}
export { default as preload } from "../../../../42/core/load/preload.js"
