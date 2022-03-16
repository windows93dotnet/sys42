import compositor from "../compositor.js"
import listen from "../../fabric/dom/listen.js"
import uid from "../../fabric/uid.js"
import inIframe from "../../system/env/runtime/inIframe.js"
import { isFocusable } from "../../fabric/dom/focus.js"

let layer = compositor("popups", { module: true })

layer.then((layer) => {
  const listenOptions = { capture: true }
  if (inIframe) {
    listen(listenOptions, {
      pointerdown({ target }) {
        const popupButton = target.closest("[aria-haspopup]")
        if (!popupButton) {
          layer.clear({ focusOpener: !isFocusable(target) })
        }
      },
    })
  } else {
    listen(listenOptions, {
      pointerdown({ target }) {
        if (layer.map.size === 0) return
        const popupButton = target.closest("[aria-haspopup]")
        if (!popupButton && !layer.el.contains(target)) {
          layer.clear({ focusOpener: !isFocusable(target) })
        }
      },
    })
  }
})

export async function addOpenerListeners(el, role, def, ctx) {
  const options = { signal: ctx.cancel.signal }

  const events = {
    openpopup({ detail }) {
      renderPopup(el, def, ctx, detail)
    },
  }

  if (role !== "menuitem") {
    events.pointerdown = async (e) => {
      e.stopPropagation()
      if (el.getAttribute("aria-expanded") === "true") {
        layer = await layer
        layer.clear()
      } else renderPopup(el, def, ctx, { clear: { focusOpener: false } })
    }

    events.keydown = async (e) => {
      const { code } = e
      if (
        code === "ArrowRight" ||
        code === "ArrowDown" ||
        code === "Space" ||
        code === "Enter"
      ) {
        e.preventDefault()
        renderPopup(el, def, ctx, { clear: true, autofocus: true })
      }

      if (code === "ArrowLeft" || code === "ArrowUp") {
        e.preventDefault()
        layer = await layer
        layer.clear()
      }
    }
  }

  listen(el, options, events)
}

export default async function renderPopup(el, def, ctx, options = {}) {
  def.id ??= uid()
  def.positionable.of = el.getBoundingClientRect()

  layer = await layer

  el.setAttribute("aria-expanded", "true")
  el.setAttribute("data-controls", def.id)

  options.opener = el.id
  await layer.add(def, ctx, options)

  function destroy() {
    el.setAttribute("aria-expanded", "false")
    el.removeAttribute("data-controls")
    deleteOff()
  }

  const deleteOff = layer.on("delete", { off: true }, ({ opener }) => {
    if (opener === el.id) destroy()
  })
}
