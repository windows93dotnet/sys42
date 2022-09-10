import render from "./render.js"
import dispatch from "../fabric/event/dispatch.js"
import maxZIndex from "../fabric/dom/maxZIndex.js"
import on from "../fabric/event/on.js"
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

const map = []

const { ELEMENT_NODE } = Node

on({
  "click"(e, target) {
    if (target.nodeType !== ELEMENT_NODE) return

    let i = map.length
    while (i--) {
      const { close, opener, el } = map[i]

      if (el.contains(target)) {
        map.length = i + 1
        return
      }

      close(target.id === opener)
    }

    map.length = 0
  },
  "blur || Escape"(e, target) {
    let i = map.length
    while (i--) map[i].close(target.id === opener, e.type === "blur")
    map.length = 0
  },
})

const popup = rpc(
  async function popup(def, ctx, rect, meta) {
    def.positionable = {
      preset: def.inMenuitem ? "menuitem" : "popup",
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

    if (autofocus(el) === false) el.focus()

    const deferred = defer()

    const { opener } = def

    const close = (fromOpener, fromBlur) => {
      const event = dispatch(el, "uipopupclose", { cancelable: true })
      if (event.defaultPrevented) return
      ctx.cancel()
      el.remove()
      deferred.resolve({ opener, fromOpener, fromBlur })
    }

    map.push({ el, close, opener })

    dispatch(el, "uipopupopen")

    return deferred
  },
  {
    module: import.meta.url,

    marshalling(el, def = {}, ctx) {
      if (el.getAttribute("aria-expanded") === "true") {
        el.setAttribute("aria-expanded", "false")
        return false
      }

      def = objectifyDef(def)

      if (!def.opener) {
        el.id ||= uid()
        def.opener = el.id
      }

      el.setAttribute("aria-expanded", "true")

      const rect = el.getBoundingClientRect()

      if (rpc.inTop) {
        ctx = { ...ctx }
        return [def, ctx, rect]
      }

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
