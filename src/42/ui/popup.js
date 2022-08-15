import render from "./render.js"
import maxZIndex from "../fabric/dom/maxZIndex.js"
import xlisten from "../core/ipc/xlisten.js"
import defer from "../fabric/type/promise/defer.js"
import Canceller from "../fabric/class/Canceller.js"
import setTemp from "../fabric/dom/setTemp.js"
import { autofocus } from "../fabric/dom/focus.js"

import xrealm from "../core/ipc/xrealm.js"
import { objectifyDef, forkDef } from "./normalize.js"
import uid from "../core/uid.js"

let destroyLastPopup

const popup = xrealm(
  async function popup(def, ctx) {
    destroyLastPopup?.()
    ctx.cancel = new Canceller(ctx.cancel?.signal)

    const el = render(def, ctx)
    el.style.position = "fixed"
    el.style.zIndex = maxZIndex("ui-dialog, ui-menu") + 1

    setTemp(document.body, {
      signal: ctx.cancel.signal,
      class: "pointer-unclickables-0",
    })

    document.body.append(el)

    if (autofocus(el) === false) el.focus()

    const deferred = defer()

    destroyLastPopup = (fromOpener) => {
      ctx.cancel()
      el.remove()
      forget()
      destroyLastPopup = undefined
      deferred.resolve({ opener: def.opener, fromOpener })
    }

    const forget = xlisten({
      click(e, target) {
        if (target.inIframe || !el.contains(target)) {
          destroyLastPopup(target.id === def.opener)
        }
      },
    })

    return deferred
  },
  {
    inputs(el, def = {}, ctx) {
      if (el.getAttribute("aria-expanded") === "true") {
        el.setAttribute("aria-expanded", "false")
        return false
      }

      if (!def.opener) {
        el.id ||= uid()
        def.opener ??= el.id
      }

      el.setAttribute("aria-expanded", "true")

      if (xrealm.inTop) return [objectifyDef(def), { ...ctx }]
      return [forkDef(def, ctx), {}]
    },

    outputs({ res, opener, fromOpener }) {
      const el = document.querySelector(`#${opener}`)
      if (el) {
        if (document.activeElement === document.body) el.focus()
        if (!fromOpener) el.setAttribute("aria-expanded", "false")
      }

      return res
    },
  }
)

export default popup
