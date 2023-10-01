import render from "./render.js"
import unsee from "../fabric/dom/unsee.js"
import dispatch from "../fabric/event/dispatch.js"
import maxZIndex from "../fabric/dom/maxZIndex.js"
import on from "../fabric/event/on.js"
import defer from "../fabric/type/promise/defer.js"
import Canceller from "../fabric/classes/Canceller.js"
import focus from "../fabric/dom/focus.js"
import queueTask from "../fabric/type/function/queueTask.js"
import uid from "../core/uid.js"
import rpc from "../core/ipc/rpc.js"
import normalize, {
  objectifyPlan,
  forkPlan,
  normalizePlugins,
} from "./normalize.js"

const zIndexSector = ":root > :is(ui-dialog, ui-menu)"

const popupsList = []
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
      selector: `[role^="menuitem"]:not([aria-haspopup="menu"])`,
      click: closeAll,
    },
  )
}

export function closeOthers(e, target = e?.target) {
  if (e?.nodeType === ELEMENT_NODE) {
    target = e
    e = undefined
  } else if (target.nodeType !== ELEMENT_NODE) return

  let i = popupsList.length
  while (i--) {
    const { el, close, opener, realm } = popupsList[i]

    if (el.contains(target)) {
      if (e?.key === "ArrowLeft") {
        popupsList.length = i
        close({
          fromOpener: target?.id === opener && realm === window.name,
        })
      } else {
        popupsList.length = i + 1
      }

      return
    }

    close(
      i === 0
        ? { fromOpener: target?.id === opener && realm === window.name }
        : undefined,
    )
  }

  forgetGlobalEvents?.()
  popupsList.length = 0
}

export function closeAll(e, target = e?.target) {
  if (e?.nodeType === ELEMENT_NODE) {
    target = e
    e = undefined
  }

  let i = popupsList.length
  while (i--) {
    const { close, opener, realm } = popupsList[i]
    close(
      i === 0
        ? {
            fromOpener: target?.id === opener && realm === window.name,
            fromBlur: e?.type === "blur",
            focusOut: e?.focusOut,
          }
        : undefined,
    )
  }

  forgetGlobalEvents?.()
  popupsList.length = 0
}

function focusOut(dir, e) {
  if (popupsList.length > 0) {
    e.preventDefault()
    closeAll({ focusOut: dir })
  }
}

function combineRect(rect1, rect2) {
  rect1.x += rect2.x
  rect1.y += rect2.y
  return rect1
}

export const popup = rpc(
  async function popup(plan, stage, rect, meta) {
    const closeEvents = plan.closeEvents ?? "pointerdown"
    forgetLastPopupClose?.()
    forgetLastPopupClose = on({ [closeEvents]: closeOthers })

    plan.positionable = {
      preset: plan.fromMenuitem && !plan.fromMenubar ? "menuitem" : "popup",
      of: meta?.iframe
        ? combineRect(rect, meta.iframe.getBoundingClientRect())
        : rect,
    }

    const { autofocus } = plan
    delete plan.autofocus

    const normalized = normalize(plan, stage)
    stage = normalized[1]

    stage.cancel = new Canceller(stage.cancel?.signal)
    stage.signal = stage.cancel.signal

    await stage.waitlistPreload.done()
    const el = render(...normalized, { skipNormalize: true })
    el.style.position = "fixed"
    el.style.translate = "-200vw -200vh"
    el.style.zIndex = maxZIndex(zIndexSector) + 1

    document.documentElement.append(el)

    if ("ready" in el) await el.ready
    else {
      await stage.pendingDone()
      await stage.waitlistPostrender.call()
    }

    await el.positionable

    if (autofocus === "menu") el.focus()
    else if (autofocus !== false) focus.autofocus(el)

    dispatch(el, "uipopupopen")

    const deferred = defer()

    const { opener, realm, focusBack } = plan

    const close = (options) => {
      const event = dispatch(el, "uipopupbeforeclose", { cancelable: true })
      if (event.defaultPrevented) return
      unsee(el)
      if (el.contains(document.activeElement)) document.activeElement.blur()
      queueTask(() => {
        deferred.resolve({ opener, focusBack, ...options })
        requestIdleCallback(async () => {
          await stage.pendingDone
          dispatch(el, "uipopupclose")
          el.remove()
          stage.cancel("ui popup closed")
        })
      })
    }

    if (popupsList.length === 0) listenGlobalEvents()

    if (el[_close] === true) {
      el.close = close
      el.closeOthers = closeOthers
      el.closeAll = closeAll
    }

    popupsList.push({ el, close, opener, realm, closeEvents })

    return deferred
  },
  {
    module: import.meta.url,

    async marshalling(el, plan = {}, stage) {
      if (el.getAttribute("aria-expanded") === "true") {
        if (!plan.fromPointermove) {
          el.setAttribute("aria-expanded", "false")
          return false
        }
      }

      plan = objectifyPlan(plan)

      if (!plan.opener) {
        el.id ||= uid()
        plan.opener = el.id
      }

      el.setAttribute("aria-expanded", "true")

      const rect = plan.rect ?? el.getBoundingClientRect()

      if (rpc.inTop) {
        stage = { ...stage }
        return [plan, stage, rect]
      }

      if (stage) await normalizePlugins(stage, ["ipc"], { now: true })

      return [forkPlan(plan, stage), {}, rect]
    },

    unmarshalling(options) {
      if (!options) return
      const { opener, fromOpener, fromBlur, focusOut, focusBack } = options

      const el = document.querySelector(`#${opener}`)

      if (fromBlur && document.activeElement === el) return

      if (el) {
        if (!fromOpener) el.setAttribute("aria-expanded", "false")

        if (focusBack) {
          document.querySelector(`#${focusBack}`)?.focus()
          return
        }

        if (focusOut) {
          const menu = el.closest("ui-menu, ui-menubar")

          if (menu) focus.autofocus(menu)
          else el.focus()

          focus[focusOut]()
          return
        }

        if (document.activeElement === document.body) el.focus()
      }
    },
  },
)

export default popup
