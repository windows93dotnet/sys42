import render from "./render.js"
import dispatch from "../fabric/dom/dispatch.js"
import maxZIndex from "../fabric/dom/maxZIndex.js"
import xlisten from "../core/ipc/xlisten.js"
import defer from "../fabric/type/promise/defer.js"
import Canceller from "../fabric/class/Canceller.js"
import setTemp from "../fabric/dom/setTemp.js"
import { autofocus } from "../fabric/dom/focus.js"

import xrealm from "../core/ipc/xrealm.js"
import normalize, { objectifyDef, forkDef } from "./normalize.js"
import uid from "../core/uid.js"

function combineRect(rect1, rect2) {
  rect1.x += rect2.x
  rect1.y += rect2.y
  return rect1
}

let close

const popup = xrealm(
  async function popup(def, ctx, rect, meta) {
    close?.()
    ctx.cancel = new Canceller(ctx.cancel?.signal)

    def.positionable = {
      preset: "popup",
      of: meta?.iframe
        ? combineRect(rect, meta.iframe.getBoundingClientRect())
        : rect,
    }

    const normalized = normalize(def, ctx)
    const el = render(...normalized, { skipNormalize: true })
    el.style.position = "fixed"
    el.style.transform = "translate(-200vw, -200vh)"
    el.style.zIndex = maxZIndex("ui-dialog, ui-menu") + 1

    setTemp(document.body, {
      signal: ctx.cancel.signal,
      class: { "pointer-unclickables-0": true },
    })

    await normalized[1].preload.done()
    document.body.append(el)
    await normalized[1].reactive.done()

    dispatch(el, "uipopupopen")

    if (autofocus(el) === false) el.focus()

    const deferred = defer()

    close = (fromOpener) => {
      const event = dispatch(el, "uipopupclose", { cancelable: true })
      if (event.defaultPrevented) return
      ctx.cancel()
      el.remove()
      forget()
      close = undefined
      deferred.resolve({ opener: def.opener, fromOpener })
    }

    const forget = xlisten({
      click(e, target) {
        if (target.inIframe || !el.contains(target)) {
          close(target.id === def.opener)
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
      const rect = el.getBoundingClientRect()

      if (xrealm.inTop) return [objectifyDef(def), { ...ctx }, rect]
      return [forkDef(def, ctx), {}, rect]
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
