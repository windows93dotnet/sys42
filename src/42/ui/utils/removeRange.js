import getNodesInRange from "../../fabric/range/getNodesInRange.js"
import renderAnimation from "../renderers/renderAnimation.js"

export default function removeRange(range, plan, stage) {
  const anim = plan?.animate?.to
  if (anim) {
    for (const el of getNodesInRange(range)) {
      if (el.nodeType === Node.ELEMENT_NODE) {
        renderAnimation(stage, el, "to", anim).then(() => el.remove())
      } else el.remove()
    }
  } else {
    range.deleteContents()
  }
}
