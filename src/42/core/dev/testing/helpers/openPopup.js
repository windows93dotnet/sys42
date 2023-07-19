import ui from "../../../../ui.js"
import system from "../mainSystem.js"
import preload from "../../../load/preload.js"
import inTop from "../../../env/realm/inTop.js"
import listen from "../../../../fabric/event/listen.js"
import uid from "../../../uid.js"

import "../../../../ui/popup.js"

const idMap = new Map()

let current = 0
const responses = new Map()
export function log(promise) {
  responses.set(current, promise)
  if (system.testing.manual) {
    Promise.all([import("../../../log.js"), promise]).then(([m, arg]) =>
      m.default.inspect.async(arg),
    )
  }
}

const { top } = globalThis

export async function openPopup(t, open, ...rest) {
  let fn
  let close
  let expected
  let hasExpected = false

  if (typeof rest.at(-1) === "function") fn = rest.pop()

  if (rest.length === 1) {
    close = rest[0]
  } else if (rest.length === 2) {
    close = rest[0]
    expected = rest[1]
    hasExpected = true
  }

  const id = ++current
  const openIsString = typeof open === "string"
  const el = openIsString
    ? document.querySelector(open) || document.querySelector(idMap.get(open))
    : open
  const originalId = el.id
  const newId = originalId + id + (inTop ? "top" : "iframe")
  if (openIsString) idMap.set(open, "#" + newId)

  const p = new Promise((resolve, reject) => {
    const forget = listen(top, {
      async "uidialogopen || uipopupopen"({ target }) {
        if (target.opener === newId) {
          forget()

          await 0

          if (fn) {
            try {
              const advance = await fn?.(target)
              if (advance === false || close === false) return resolve(target)
            } catch (err) {
              reject(err)
            }
          }

          if (close) {
            t.puppet(close, target).click().run()
          }

          resolve(target)
        }
      },
    })
  })

  const forget = listen(top, {
    "uidialogclose || uipopupclose"({ target }) {
      if (target.opener === newId) {
        forget()
        el.id = originalId
      }
    },
  })

  el.id = newId
  t.puppet(el).click().run()
  // el.id = originalId
  const res = responses.get(id)

  const target = await p

  if (close === undefined && fn === undefined) return target

  if (hasExpected) t.eq(await res, expected)

  // await t.timeout("reset")
  // await t.utils.idle()
  // await t.timeout("reset")
  await t.sleep(20)
  return res
}

export async function makeRealm(
  t,
  { href, top = true, iframe = true, sync = true },
  makeContent,
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
                top ? makeContent() : undefined,
                iframe
                  ? {
                      tag: "ui-sandbox.ground",
                      permissions: "trusted",
                      path: `${href}?test=true&initiator=${id}`,
                    }
                  : undefined,
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

export default { preload, openPopup, makeRealm, log }

export { default as preload } from "../../../load/preload.js"
export { default as inTop } from "../../../env/realm/inTop.js"
