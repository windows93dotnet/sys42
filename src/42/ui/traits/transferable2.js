import system from "../../system.js"
import Trait from "../classes/Trait.js"
import Dragger from "../classes/Dragger.js"
import getRects from "../../fabric/dom/getRects.js"
import pick from "../../fabric/type/object/pick.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import makeHints from "./transferable2/makeHints.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import "./transferable2/ipcItemsHint.js"

const DEFAULTS = {
  selector: ":scope > *",
  autoScroll: true,
  useSelection: true,
  handlerSelector: undefined,
  hints: {
    items: {
      name: "stack",
      startAnimation: { ms: 180 },
      stopAnimation: { ms: 180 },
    },
    dropzone: {
      name: "slide",
    },
  },
}

const configure = settings("ui.trait.transferable", DEFAULTS)

system.transfer = {
  dropzones: new Map(),
}

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    this.config.selector = ensureScopeSelector(this.config.selector, this.el)

    this.items = []
    this.init()
  }

  async init() {
    const { signal } = this.cancel

    this.hints = await makeHints(this.config.hints, this.el)

    system.transfer.dropzones.set(this.el, this.hints.dropzone)

    this.dragger = new Dragger(this.el, {
      signal,
      useTargetOffset: false,
      ...pick(this.config, ["selector", "autoScroll", "useSelection"]),

      start: (x, y, e, target) => {
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
            targets = [...elements]
            removeItem(targets, target)
            targets.unshift(target)
          } else targets = [target]
        } else targets = [target]

        this.items.length = 0

        getRects(targets).then((items) => {
          for (const item of items) {
            item.offsetX = x - item.x
            item.offsetY = y - item.y
            this.items.push(item)
          }

          this.hints.items.start?.(x, y, this.items)
        })
      },

      drag: (x, y) => {
        this.hints.items.drag?.(x, y, this.items)
      },

      stop: (x, y) => {
        this.hints.items.stop?.(x, y, this.items)
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
