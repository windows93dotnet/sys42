import render from "./render.js"
import dispatch from "../fabric/dom/dispatch.js"
import maxZIndex from "../fabric/dom/maxZIndex.js"
import listen from "../fabric/dom/listen.js"
import defer from "../fabric/type/promise/defer.js"
import Canceller from "../fabric/class/Canceller.js"
import { autofocus } from "../fabric/dom/focus.js"

import rpc from "../core/ipc/rpc.js"
import normalize, { objectifyDef, forkDef } from "./normalize.js"
import uid from "../core/uid.js"

function combineRect(rect1, rect2) {
  rect1.x += rect2.x
  rect1.y += rect2.y
  return rect1
}

let close

const popup = rpc(
  async function popup(def, ctx, rect, meta) {
    if (close?.() === false) return

    def.positionable = {
      preset: "popup",
      of: meta?.iframe
        ? combineRect(rect, meta.iframe.getBoundingClientRect())
        : rect,
    }

    const normalized = normalize(def, ctx)
    ctx = normalized[1]

    ctx.cancel = new Canceller(ctx.cancel?.signal)
    ctx.signal = ctx.cancel.signal

    const el = render(...normalized, { skipNormalize: true })
    el.style.position = "fixed"
    el.style.transform = "translate(-200vw, -200vh)"
    el.style.zIndex = maxZIndex("ui-dialog, ui-menu") + 1

    await ctx.preload.done()
    document.body.append(el)
    await ctx.reactive.done()

    dispatch(el, "uipopupopen")

    if (autofocus(el) === false) el.focus()

    const deferred = defer()

    close = (fromOpener, fromBlur) => {
      const event = dispatch(el, "uipopupclose", { cancelable: true })
      if (event.defaultPrevented) return false
      ctx.cancel()
      el.remove()
      forget()
      close = undefined
      deferred.resolve({ opener: def.opener, fromOpener, fromBlur })
    }

    const forget = listen({
      "blur || click"(e, target) {
        if (!(target.nodeType === Node.ELEMENT_NODE && el.contains(target))) {
          close(target.id === def.opener, e.type === "blur")
        }
      },
    })

    return deferred
  },
  {
    marshalling(el, def = {}, ctx) {
      if (el.getAttribute("aria-expanded") === "true") {
        el.setAttribute("aria-expanded", "false")
        return false
      }

      if (!def.opener) {
        el.id ||= uid()
        def.opener = el.id
      }

      el.setAttribute("aria-expanded", "true")
      const rect = el.getBoundingClientRect()

      if (rpc.inTop) return [objectifyDef(def), { ...ctx }, rect]
      return [forkDef(def, ctx), {}, rect]
    },

    unmarshalling({ res, opener, fromOpener, fromBlur }) {
      const el = document.querySelector(`#${opener}`)

      if (fromBlur && document.activeElement === el) return res

      if (el) {
        if (document.activeElement === document.body) el.focus()
        if (!fromOpener) el.setAttribute("aria-expanded", "false")
      }

      return res
    },
  }
)

export default popup
