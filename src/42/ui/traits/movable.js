import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import Dragger from "../classes/Dragger.js"
import setTemp from "../../fabric/dom/setTemp.js"
import maxZIndex from "../../fabric/dom/maxZIndex.js"
import getRects from "../../fabric/dom/getRects.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import pick from "../../fabric/type/object/pick.js"

const DEFAULTS = {
  distance: 0,
  grid: false,
  throttle: true,
  subpixel: false,
  selector: undefined,
  ignore: "input,button,textarea,[contenteditable],[contenteditable] *",
  autoScroll: false,
  targetOffset: true,
  zIndexSelector: undefined,
  handler: undefined,
  useSelection: true,
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

    this.config = configure(options)
    this.targets = new WeakMap()
    this.draggeds = []
    const { signal } = this.cancel
    const tempStyle = { signal, style: this.config.style }

    this.dragger = new Dragger(this.el, {
      signal,
      ...pick(this.config, [
        "distance",
        "grid",
        "throttle",
        "subpixel",
        "selector",
        "ignore",
        "autoScroll",
        "targetOffset",
      ]),
    })

    this.dragger.start = (x, y, e, target) => {
      if (this.config.handler && !e.target.closest(this.config.handler)) {
        return false
      }

      let targets

      if (this.config.useSelection) {
        const selectable = this.el[Trait.INSTANCES]?.selectable
        if (selectable) {
          selectable.ensureSelected(target)
          const { elements } = selectable
          targets = elements
        } else targets = [target]
      } else targets = [target]

      this.draggeds.length = 0

      getRects(targets).then((items) => {
        for (const item of items) {
          const { target } = item
          if (this.targets.has(target)) {
            this.draggeds.push(this.targets.get(target))
            target.style.zIndex = maxZIndex(this.config.zIndexSelector) + 1
            continue
          }

          const hasCoordProps =
            target.constructor.definition?.props?.x &&
            target.constructor.definition?.props?.y

          const style = {
            zIndex: maxZIndex(this.config.zIndexSelector) + 1,
            width: item.width + "px",
            height: item.height + "px",
          }

          if (hasCoordProps) {
            target.x = x
            target.y = y
          } else style.translate = `${x}px ${y}px`

          const restoreStyles = setTemp(target, tempStyle, { style })

          item.restore = () => {
            restoreStyles()
            removeItem(this.draggeds, item)
            this.targets.delete(target)
          }

          item.hasCoordProps = hasCoordProps
          this.targets.set(target, item)
          this.draggeds.push(item)
        }
      })
    }

    this.dragger.drag = (x, y) => {
      for (const { target, hasCoordProps } of this.draggeds) {
        if (hasCoordProps) {
          target.x = x
          target.y = y
        } else target.style.translate = `${x}px ${y}px`
      }
    }
  }
}

export function movable(...args) {
  return new Movable(...args)
}

export default movable
