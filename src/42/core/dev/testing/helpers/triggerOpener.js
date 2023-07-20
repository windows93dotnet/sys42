import system from "../mainSystem.js"
import inTop from "../../../env/realm/inTop.js"
import listen from "../../../../fabric/event/listen.js"

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

export async function triggerOpener(t, open, ...rest) {
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

  // Save the new ID to prevent successive calls to fail
  // TODO: find better solution
  if (openIsString) idMap.set(open, "#" + newId)

  // Always restore the original ID on close
  const forget = listen(top, {
    "uidialogclose || uipopupclose"({ target }) {
      if (target.opener === newId) {
        forget()
        el.id = originalId
      }
    },
  })

  el.id = newId

  const openPromise = new Promise((resolve, reject) => {
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

  t.puppet(el).click().run()
  const res = responses.get(id)
  const popupTarget = await openPromise

  if (close === undefined && fn === undefined) return popupTarget

  if (hasExpected) t.eq(await res, expected)

  // Some tests fail using too many concurrent async calls without delay
  // TODO: find better solution
  await t.sleep(20)
  // await t.timeout("reset")
  // await t.utils.idle()
  // await t.timeout("reset")

  return res
}

export default triggerOpener
