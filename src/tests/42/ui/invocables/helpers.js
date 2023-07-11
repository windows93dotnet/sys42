import ui from "../../../../42/ui.js"
import system from "../../../../42/core/dev/testing/mainSystem.js"
import preload from "../../../../42/core/load/preload.js"
import inTop from "../../../../42/core/env/realm/inTop.js"
import listen from "../../../../42/fabric/event/listen.js"
import uid from "../../../../42/core/uid.js"

import "../../../../42/ui/popup.js"

let current = 0
const responses = new Map()
export function log(promise) {
  responses.set(current, promise)
  if (system.testing.manual) {
    Promise.all([import("../../../../42/core/log.js"), promise]).then(
      ([m, arg]) => m.default.inspect.async(arg),
    )
  }
}

const { top } = globalThis

export async function launch(t, open, close, ...rest) {
  let fn
  let expected
  let hasExpected = false

  if (rest.length === 1 && typeof rest[0] === "function") {
    fn = rest[0]
  } else {
    hasExpected = true
    expected = rest[0]
    fn = rest[1]
  }

  const id = ++current
  const el = typeof open === "string" ? document.querySelector(open) : open
  const originalId = el.id
  const newId = originalId + id + inTop

  const p = new Promise((resolve, reject) => {
    const forget = listen(top, {
      async "uidialogopen || uipopupopen"({ target }) {
        if (target.opener === newId) {
          forget()

          await 0

          try {
            const advance = await fn?.(target)
            if (advance === false || close === false) return resolve()
          } catch (err) {
            reject(err)
          }

          t.puppet(close, target).click().run()
          resolve()
        }
      },
    })
  })

  el.id = newId
  t.puppet(el).click().run()
  el.id = originalId

  const res = responses.get(id)

  await p

  if (hasExpected) t.eq(await res, expected)

  // await t.timeout("reset")
  // await t.utils.idle()
  // await t.timeout("reset")
  await t.sleep(20)
  return res
}

export async function make(
  t,
  { href, makeContent, iframe = true, sync = true },
) {
  const id = uid()
  const app = await t.utils.decay(
    ui(
      t.utils.dest({ connect: true }),
      inTop
        ? {
            tag: ".box-fit.desktop",
            content: {
              tag: ".box-h.size-full",
              content: [
                makeContent(),
                iframe && {
                  tag: "ui-sandbox.ground",
                  permissions: "trusted",
                  path: `${href}?test=true&initiator=${id}`,
                },
              ],
            },
          }
        : {
            tag: ".box-fit",
            content: makeContent(),
          },
      inTop
        ? { id, trusted: true }
        : sync
        ? { initiator: new URLSearchParams(location.search).get("initiator") }
        : undefined,
    ),
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
export { default as inTop } from "../../../../42/core/env/realm/inTop.js"
