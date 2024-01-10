import system from "../mainSystem.js"
import inTop from "../../../env/realm/inTop.js"
import listen from "../../../../fabric/event/listen.js"
import isHashmapLike from "../../../../fabric/type/any/is/isHashmapLike.js"

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

export async function triggerOpener(t, open, ...args) {
  let fn
  let close
  let expected
  let waitClose
  let closePromise
  let hasExpected = false

  if (typeof args.at(-1) === "function") fn = args.pop()

  if (args.length === 1) {
    if (isHashmapLike(args[0])) {
      close = args[0].close
      waitClose = args[0].waitClose
      expected = args[0].expected
      if (expected !== undefined) hasExpected = true
    } else close = args[0]
  } else if (args.length === 2) {
    close = args[0]
    expected = args[1]
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
  // TODO: find a better solution
  if (openIsString) idMap.set(open, "#" + newId)

  if (waitClose) closePromise = t.utils.defer()

  // Always restore the original ID on close
  const forget = listen(top, {
    "ui:dialog.close || ui:popup.close"({ target }) {
      if (target.opener === newId) {
        forget()
        el.id = originalId
        closePromise?.resolve()
      }
    },
  })

  el.id = newId

  const openPromise = new Promise((resolve, reject) => {
    const forget = listen(top, {
      async "ui:dialog.open || ui:popup.open"({ target }) {
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

  // let clickPromise

  // if (el.getAttribute("aria-haspopup") === "menu") {
  //   const menu = el.closest("ui-menu")
  //   if (menu) {
  //     clickPromise = false
  //     menu.triggerMenuitem(el)
  //   }
  // }

  // clickPromise ??= t.puppet(el).click().run()

  const clickPromise = t.puppet(el).click().run()

  const res = responses.get(id)
  const popupTarget = await openPromise

  if (hasExpected) t.eq(await res, expected)

  if (waitClose) await closePromise

  if (close === undefined && fn === undefined) {
    await clickPromise
    return popupTarget
  }

  t.timeout("reset")

  return res
}

export default triggerOpener
