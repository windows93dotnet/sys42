/* eslint-disable max-params */
import Trait from "../class/Trait.js"
import Dragger from "../class/Dragger.js"
import setup from "../../system/setup.js"
import setTemp from "../../fabric/dom/setTemp.js"
import maxZindex from "../../fabric/dom/maxZIndex.js"

const DEFAULTS = {
  distance: 0,
  grid: false,
  throttle: true,
  subpixel: false,
  selector: undefined,
  zIndexSelector: undefined,
  // TODO: // handle: undefined,
  // TODO: // ignoreSelector: "input,textarea,[contenteditable],[contenteditable] *",
  // TODO: // ghost: false,
  style: {
    "position": "fixed",
    "margin": 0,
    "top": 0,
    "left": 0,
    "min-width": "initial",
    "min-height": "initial",
    "max-width": "initial",
    "max-height": "initial",
  },
}

const configure = setup("ui.trait.movable", DEFAULTS)

class Movable extends Trait {
  constructor(el, options) {
    super(el, options)

    let isComponent

    this.config = configure(options)
    this.config.relative = true
    this.config.signal = this.cancel.signal

    this.targets = new WeakMap()
    this.dragger = new Dragger(this.el, this.config)

    const tempStyle = { signal: this.cancel.signal, style: this.config.style }

    this.dragger.on("start", (x, y, e, target) => {
      isComponent =
        target.constructor.definition?.props?.x &&
        target.constructor.definition?.props?.y

      if (this.targets.has(target)) {
        target.style.zIndex = maxZindex(this.config.zIndexSelector) + 1
      } else {
        const rect = target.getBoundingClientRect()
        const style = {
          "z-index": maxZindex(this.config.zIndexSelector) + 1,
          "width": rect.width + "px",
          "height": rect.height + "px",
        }

        if (isComponent) {
          target.x = x
          target.y = y
        } else style.transform = `translate(${x}px, ${y}px)`

        this.targets.set(target, setTemp(target, tempStyle, { style }))
      }
    })

    this.dragger.on("drag", (x, y, fromX, fromY, e, target) => {
      if (isComponent) {
        target.x = x
        target.y = y
      } else target.style.transform = `translate(${x}px, ${y}px)`
    })
  }
}

export default function movable(...args) {
  return new Movable(...args)
}
