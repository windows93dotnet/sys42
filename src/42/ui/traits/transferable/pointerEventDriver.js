import Dragger from "../../classes/Dragger.js"
import SlideHint, { getIndex, getNewIndex } from "./SlideHint.js"

let hint
let originHint

export function pointerEventDriver(trait) {
  const { effects } = trait
  const { id } = trait.dropzone

  /* dropzone
  =========== */

  const { signal } = trait.cancel

  const dragger = new Dragger(trait.el, {
    signal,
    selector: trait.selector,
  })

  dragger.start = (x, y, e, target) => {
    const index = getIndex(target)
    if (trait.config.hint === "slide") {
      hint = new SlideHint(trait, { x, y, target, index })
    }
  }

  dragger.drag = (x, y) => {
    hint?.update?.(x, y)
  }

  dragger.stop = () => {
    hint?.revert?.()
  }
}

export default pointerEventDriver
