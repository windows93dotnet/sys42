import popup from "../popup.js"
import uid from "../../core/uid.js"
import { objectifyDef } from "../normalize.js"

export async function contextmenu(el, e, plan, stage) {
  if (el.nodeType !== Node.ELEMENT_NODE && el.target) {
    stage = plan
    plan = e
    e = el
    el = e.target
  }

  el.id ||= uid()
  popup(
    el,
    {
      tag: "ui-menu",
      closeEvents: "pointerdown",
      opener: el.id,
      rect: { x: e.x, y: e.y },
      ...objectifyDef(plan),
    },
    stage
  )
}

export default contextmenu
