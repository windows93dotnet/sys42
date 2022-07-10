import getElementsInRange from "../../fabric/range/getElementsInRange.js"
import renderAnimation from "./renderAnimation.js"

export default function removeRange(range, def) {
  const anim = def.to ?? def.animate
  if (anim) {
    Promise.all(
      getElementsInRange(range).map((node) =>
        renderAnimation(node, "to", anim).then(() => node.remove())
      )
    )
  } else {
    range.deleteContents()
  }
}
