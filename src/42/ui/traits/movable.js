import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import Dragger from "../classes/Dragger.js"
import setTemp from "../../fabric/dom/setTemp.js"
import maxZIndex from "../../fabric/dom/maxZIndex.js"
import getRects from "../../fabric/dom/getRects.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import pick from "../../fabric/type/object/pick.js"
import noop from "../../fabric/type/function/noop.js"

const DEFAULTS = {
  distance: 0,
  grid: false,
  throttle: true,
  subpixel: false,
  selector: undefined,
  ignore: "input,button,textarea,[contenteditable],[contenteditable] *",
  hoverScroll: false,
  applyTargetOffset: true,
  zIndexSelector: undefined,
  handlerSelector: undefined,
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

    this.start = this.config.start ?? noop
    this.drag = this.config.drag ?? noop
    this.stop = this.config.stop ?? noop

    this.targets = new WeakMap()
    this.items = []
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
        "hoverScroll",
        "applyTargetOffset",
      ]),
    })

    this.dragger.start = (x, y, e, target) => {
      if (
        this.config.handlerSelector &&
        !e.target.closest(this.config.handlerSelector)
      ) {
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

      this.items.length = 0

      getRects(targets).then((items) => {
        if (this.start(x, y, items) === false) return

        for (const item of items) {
          const { target } = item

          if (this.targets.has(target)) {
            this.items.push(this.targets.get(target))
            target.style.zIndex = maxZIndex(this.config.zIndexSelector) + 1
            continue
          }

          const hasCoordProps =
            target.constructor.plan?.props?.x &&
            target.constructor.plan?.props?.y

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
            removeItem(this.items, item)
            this.targets.delete(target)
          }

          item.hasCoordProps = hasCoordProps

          this.targets.set(target, item)
          this.items.push(item)
        }
      })
    }

    this.dragger.drag = (x, y) => {
      if (this.drag(x, y, this.items) === false) return

      for (const { target, hasCoordProps } of this.items) {
        if (hasCoordProps) {
          target.x = x
          target.y = y
        } else target.style.translate = `${x}px ${y}px`
      }
    }

    this.dragger.stop = (x, y) => {
      this.stop(x, y, this.items)
    }
  }
}

export function movable(...args) {
  return new Movable(...args)
}

export default movable
