import Trait from "../classes/Trait.js"
import movable from "./movable.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import { animateTo } from "../../fabric/dom/animate.js"

const DEFAULTS = {
  selector: ":scope > *",
  revert: 180,
  // dropzone: undefined,
  // effects: ["copy", "move", "link"],
  // // driver: "dragEvent",
  // driver: "pointerEvent",
  // hint: "slide",
  // // hint: { type: "float" },
  // ignoreSelectable: false,
}

const configure = settings("ui.trait.transferable", DEFAULTS)

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    this.config.selector = ensureScopeSelector(this.config.selector, this.el)
    const { selector } = this.config

    this.movable = movable(this.el, {
      selector,
      autoScroll: true,
    })

    this.movable.dragger.stop = (_x, _y, e, target) => {
      const { x, y, restore } = this.movable.targets.get(target)
      this.movable.targets.delete(target)

      if (this.config.revert) {
        animateTo(
          target,
          { translate: `${x}px ${y}px` },
          this.config.revert
        ).then(() => restore())
      } else restore()
    }
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
