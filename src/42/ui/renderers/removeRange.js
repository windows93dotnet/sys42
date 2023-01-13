import getNodesInRange from "../../fabric/range/getNodesInRange.js"
import renderAnimation from "./renderAnimation.js"

export default function removeRange(ctx, range, plan) {
  const anim = plan?.animate?.to
  if (anim) {
    for (const el of getNodesInRange(range)) {
      if (el.nodeType === Node.ELEMENT_NODE) {
        renderAnimation(ctx, el, "to", anim).then(() => el.remove())
      } else el.remove()
    }
  } else {
    range.deleteContents()
  }
}
