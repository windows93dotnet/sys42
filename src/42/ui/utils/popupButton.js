import uid from "../../fabric/uid.js"
import listen from "../../fabric/dom/listen.js"
import render from "../render.js"

// @read https://labs.levelaccess.com/index.php/ARIA_Haspopup_property
const POPUP_TYPES = new Set(["menu", "listbox", "tree", "grid", "dialog"])

export default function popupButton(el, def, ctx) {
  const role = el.getAttribute("role")

  const isSubmenu = role === "menuitem" && !def.inMenubar
  const pictoName = isSubmenu ? "right" : "down"
  def.positionable = { preset: isSubmenu ? "menuitem" : "popup" }

  const type = def.type.startsWith("ui-") ? def.type.slice(3) : def.type
  const haspopup = POPUP_TYPES.has(type) ? type : "true"
  el.id ||= uid()
  el.setAttribute("aria-haspopup", haspopup)

  if (type === "dialog") {
    const options = { signal: ctx.signal }
    listen(el, options, {
      async click() {
        const dialog = await import("../components/dialog.js") //
          .then((m) => m.default)

        const options = { opener: el.id }
        dialog(def.content, ctx, options)
      },
    })
  } else {
    el.setAttribute("aria-expanded", "false")

    el.append(render({ type: "ui-picto", value: pictoName }, ctx))

    ctx.undones.push(
      import("../renderers/renderPopup.js").then((m) => {
        m.addOpenerListeners(el, role, def, ctx)
        return "renderer renderPopup"
      })
    )
  }

  return el
}
