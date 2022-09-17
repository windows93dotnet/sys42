/* eslint-disable max-params */
import Trait from "../class/Trait.js"
import Dragger from "../class/Dragger.js"
import setup from "../../core/setup.js"
import setTemp from "../../fabric/dom/setTemp.js"
import maxZIndex from "../../fabric/dom/maxZIndex.js"

const DEFAULTS = {
  distance: 0,
  grid: false,
  throttle: true,
  subpixel: false,
  selector: undefined,
  maxZIndex: undefined,
  handler: undefined,
  ignore: "input,button,textarea,[contenteditable],[contenteditable] *",
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
    this.config.signal = this.cancel.signal

    this.targets = new WeakMap()

    const tempStyle = { signal: this.cancel.signal, style: this.config.style }

    this.config.targetRelative = true
    this.dragger = new Dragger(this.el, this.config)

    this.dragger.start = (x, y, e, target) => {
      if (this.config.handler && !e.target.closest(this.config.handler)) {
        return false
      }

      isComponent =
        target.constructor.definition?.props?.x &&
        target.constructor.definition?.props?.y

      if (this.targets.has(target)) {
        target.style.zIndex = maxZIndex(this.config.maxZIndex) + 1
      } else {
        const rect = target.getBoundingClientRect()
        const style = {
          "z-index": maxZIndex(this.config.maxZIndex) + 1,
          "width": rect.width + "px",
          "height": rect.height + "px",
        }

        if (isComponent) {
          target.x = x
          target.y = y
        } else style.transform = `translate(${x}px, ${y}px)`

        this.targets.set(target, setTemp(target, tempStyle, { style }))
      }
    }

    this.dragger.drag = (x, y, fromX, fromY, e, target) => {
      if (isComponent) {
        target.x = x
        target.y = y
      } else target.style.transform = `translate(${x}px, ${y}px)`
    }
  }
}

export default function movable(...args) {
  return new Movable(...args)
}
