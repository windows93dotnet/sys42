import render from "./render.js"
import unsee from "../fabric/dom/unsee.js"
import dispatch from "../fabric/event/dispatch.js"
import maxZIndex from "../fabric/dom/maxZIndex.js"
import on from "../fabric/event/on.js"
import defer from "../fabric/type/promise/defer.js"
import Canceller from "../fabric/classes/Canceller.js"
import focus from "../fabric/dom/focus.js"
import queueTask from "../fabric/type/function/queueTask.js"

import rpc from "../core/ipc/rpc.js"
import normalize, { objectifyDef, forkDef } from "./normalize.js"
import uid from "../core/uid.js"

const map = []
const _close = Symbol.for("42_POPUP_CLOSE")
const { ELEMENT_NODE } = Node

let forgetLastPopupClose
let forgetGlobalEvents

function listenGlobalEvents() {
  forgetGlobalEvents = on(
    {
      "blur || Escape": closeAll,
    },
    {
      "selector": '[role^="menuitem"]',
      "Tab": (e) => focusOut("next", e), // TODO: focusOut for non-menu popup
      "Shift+Tab": (e) => focusOut("prev", e),
    },
    {
      selector: `[role^="menuitem"]:not([aria-haspopup])`,
      click: closeAll,
    }
  )
}

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

  forgetGlobalEvents()
  map.length = 0
}

function closeAll(e, target = e.target) {
  let i = map.length
  while (i--) {
    map[i].close(
      i === 0
        ? {
            fromOpener: target?.id === opener,
            fromBlur: e?.type === "blur",
            focusOut: e?.focusOut,
          }
        : undefined
    )
  }

  forgetGlobalEvents()
  map.length = 0
}

function focusOut(dir, e) {
  if (map.length > 0) {
    e.preventDefault()
    closeAll({ focusOut: dir })
  }
}

function combineRect(rect1, rect2) {
  rect1.x += rect2.x
  rect1.y += rect2.y
  return rect1
}

const popup = rpc(
  async function popup(def, ctx, rect, meta) {
    def.positionable = {
      preset: def.inMenuitem && !def.inMenubar ? "menuitem" : "popup",
      of: meta?.iframe
        ? combineRect(rect, meta.iframe.getBoundingClientRect())
        : rect,
    }

    const normalized = normalize(def, ctx)
    ctx = normalized[1]

    ctx.cancel = new Canceller(ctx.cancel?.signal)
    ctx.signal = ctx.cancel.signal

    await ctx.preload.done()
    const el = render(...normalized, { skipNormalize: true })
    el.style.position = "fixed"
    el.style.transform = "translate(-200vw, -200vh)"
    el.style.zIndex = maxZIndex("ui-dialog, ui-menu") + 1

    document.body.append(el)
    dispatch(el, "uipopupopen")
    if (el.ready) await el.ready
    else {
      await ctx.reactive.done()
      await ctx.postrender.call()
    }

    focus.autofocus(el)

    const deferred = defer()

    const { opener } = def

    const close = (options) => {
      const event = dispatch(el, "uipopupclose", { cancelable: true })
      if (event.defaultPrevented) return
      unsee(el)
      if (el.contains(document.activeElement)) document.activeElement.blur()
      requestIdleCallback(async () => {
        await ctx.reactive.pendingUpdate
        ctx.cancel()
        el.remove()
      })
      queueTask(() => deferred.resolve({ opener, ...options }))
    }

    if (map.length === 0) listenGlobalEvents()

    const closeEvents = def.closeEvents ?? "pointerdown"
    forgetLastPopupClose?.()
    forgetLastPopupClose = on({ [closeEvents]: closeOthers })

    if (el[_close] === true) {
      el.close = close
      el.closeOthers = closeOthers
      el.closeAll = closeAll
    }

    map.push({ el, close, opener, closeEvents })

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

      const rect = def.rect ?? el.getBoundingClientRect()

      if (rpc.inTop) {
        ctx = { ...ctx }
        return [def, ctx, rect]
      }

      return [forkDef(def, ctx), {}, rect]
    },

    unmarshalling(options) {
      if (!options) return
      const { opener, fromOpener, fromBlur, focusOut } = options
      const el = document.querySelector(`#${opener}`)

      if (fromBlur && document.activeElement === el) return

      if (el) {
        if (!fromOpener) el.setAttribute("aria-expanded", "false")

        if (focusOut) {
          const menu = el.closest("ui-menu,ui-menubar")

          if (menu) focus.autofocus(menu)
          else el.focus()

          focus[focusOut]()
          return
        }

        if (document.activeElement === document.body) el.focus()
      }
    },
  }
)

export default popup
