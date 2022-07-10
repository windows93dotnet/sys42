import getElementsInRange from "../../fabric/range/getElementsInRange.js"
import renderAnimation from "./renderAnimation.js"

export default function removeRange(range, def) {
  const anim = def?.to ?? def?.animate
  if (anim) {
    Promise.all(
      getElementsInRange(range).map((el) =>
        renderAnimation(el, "to", anim).then(() => el.remove())
      )
    )
  } else {
    range.deleteContents()
  }
}
