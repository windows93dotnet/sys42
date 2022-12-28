import Trait from "../classes/Trait.js"
import movable from "./movable.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import ghostify from "../../fabric/dom/ghostify.js"
import { animateTo, animateFrom } from "../../fabric/dom/animate.js"

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
      start: (x, y, draggeds) => {
        for (const item of draggeds) {
          item.target = ghostify(item.target)
          item.target.classList.remove("selected")
          document.documentElement.append(item.target)
          if (draggeds.length > 1) {
            animateFrom(
              item.target,
              { translate: `${item.x}px ${item.y}px` },
              this.config.revert
            )
          }
        }
      },
      stop: (x, y, draggeds) => {
        for (const { x, y, target } of draggeds) {
          if (this.config.revert) {
            animateTo(
              target,
              { translate: `${x}px ${y}px` },
              this.config.revert
            ).then(() => target.remove())
          }
        }
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
