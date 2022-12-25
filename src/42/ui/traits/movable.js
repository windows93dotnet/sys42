import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import Dragger from "../classes/Dragger.js"
import setTemp from "../../fabric/dom/setTemp.js"
import maxZIndex from "../../fabric/dom/maxZIndex.js"

const DEFAULTS = {
  distance: 0,
  grid: false,
  throttle: true,
  subpixel: false,
  selector: undefined,
  zIndexSelector: undefined,
  handler: undefined,
  ignore: "input,button,textarea,[contenteditable],[contenteditable] *",
  style: {
    position: "fixed",
    margin: 0,
    top: 0,
    left: 0,
    minWidth: "initial",
    minHeight: "initial",
    maxWidth: "initial",
    maxHeight: "initial",
  },
}

const configure = settings("ui.trait.movable", DEFAULTS)

class Movable extends Trait {
  constructor(el, options) {
    super(el, options)

    let hasCoordProps

    this.config = configure(options)
    this.config.signal = this.cancel.signal

    this.targets = new WeakMap()

    const tempStyle = { signal: this.cancel.signal, style: this.config.style }

    this.dragger = new Dragger(this.el, {
      ...this.config,
      targetOffset: true,
    })

    this.dragger.start = (x, y, e, target) => {
      if (this.config.handler && !e.target.closest(this.config.handler)) {
        return false
      }

      hasCoordProps =
        target.constructor.definition?.props?.x &&
        target.constructor.definition?.props?.y

      if (this.targets.has(target)) {
        target.style.zIndex = maxZIndex(this.config.zIndexSelector) + 1
      } else {
        const rect = target.getBoundingClientRect()
        const style = {
          zIndex: maxZIndex(this.config.zIndexSelector) + 1,
          width: rect.width + "px",
          height: rect.height + "px",
        }

        if (hasCoordProps) {
          target.x = x
          target.y = y
        } else style.translate = `${x}px ${y}px`

        const restore = setTemp(target, tempStyle, { style })
        this.targets.set(target, { x: rect.x, y: rect.y, restore })
      }
    }

    this.dragger.drag = (x, y, e, target) => {
      if (hasCoordProps) {
        target.x = x
        target.y = y
      } else target.style.translate = `${x}px ${y}px`
    }
  }
}

export function movable(...args) {
  return new Movable(...args)
}

export default movable
