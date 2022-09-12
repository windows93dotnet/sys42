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

function closeOthers(e, target = e.target) {
  if (target.nodeType !== ELEMENT_NODE) return

  let i = map.length
  while (i--) {
    const { close, opener, el } = map[i]

    if (el.contains(target)) {
      if (e.key === "ArrowLeft") {
        map.length = i
        close({ fromOpener: target?.id === opener })
      } else {
        map.length = i + 1
      }

      return
    }

    close(i === 0 ? { fromOpener: target?.id === opener } : undefined)
  }

  map.length = 0
}

function closeAll(e, target = e.target) {
  let i = map.length
  while (i--) {
    map[i].close(
      i === 0
        ? { fromOpener: target?.id === opener, fromBlur: e?.type === "blur" }
        : undefined
    )
  }

  map.length = 0
}

on({
  "pointerdown || ArrowUp || ArrowDown || ArrowLeft": closeOthers,
  "blur || Escape": closeAll,
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

    setTimeout(() => autofocus(el) || el.focus(), 0)

    const deferred = defer()

    const { opener } = def

    const close = (options) => {
      const event = dispatch(el, "uipopupclose", { cancelable: true })
      if (event.defaultPrevented) return
      ctx.cancel()
      el.remove()
      deferred.resolve({ opener, ...options })
    }

    if (el.closable === true) {
      el.close = close
      el.closeOthers = closeOthers
      el.closeAll = closeAll
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

    unmarshalling(options) {
      if (!options) return
      const { opener, fromOpener, fromBlur } = options
      const el = document.querySelector(`#${opener}`)

      if (fromBlur && document.activeElement === el) return

      if (el) {
        if (document.activeElement === document.body) el.focus()
        if (!fromOpener) el.setAttribute("aria-expanded", "false")
      }
    },
  }
)

export default popup
