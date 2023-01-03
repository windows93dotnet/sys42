import system from "../../system.js"
import Trait from "../classes/Trait.js"
import Dragger from "../classes/Dragger.js"
import getRects from "../../fabric/dom/getRects.js"
import pick from "../../fabric/type/object/pick.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import {
  findTransferZones,
  setCurrentZone,
  forgetCurrentZone,
  makeHints,
} from "./transferable2/utils.js"
import "./transferable2/ipcItemsHint.js"

system.transfer = { dropzones: new Map() }

const DEFAULTS = {
  selector: ":scope > *",
  autoScroll: true,
  useSelection: true,
  handlerSelector: undefined,
  hints: {
    items: {
      name: "stack",
      startAnimation: { ms: 180 },
      revertAnimation: { ms: 180 },
      dropAnimation: { ms: 180 },
    },
    dropzone: {
      name: "slide",
    },
  },
}

const configure = settings("ui.trait.transferable", DEFAULTS)

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    this.config.selector = ensureScopeSelector(this.config.selector, this.el)

    this.init()
  }

  async init() {
    const { signal } = this.cancel

    this.hints = await makeHints(this.config.hints, this.el)

    if (this.hints.dropzone) {
      system.transfer.dropzones.set(this.el, this.hints.dropzone)
    }

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

        system.transfer.items = this.hints.items
        system.transfer.items.length = 0
        findTransferZones()

        let targets

        if (this.config.useSelection) {
          const selectable = this.el[Trait.INSTANCES]?.selectable
          if (selectable) {
            selectable.ensureSelected(target)
            const { elements } = selectable
            targets = [...elements]
            removeItem(targets, target)
            targets.unshift(target)
            selectable.clear()
          } else targets = [target]
        } else targets = [target]

        getRects(targets).then((items) => {
          for (const item of items) {
            item.offsetX = x - item.x
            item.offsetY = y - item.y
            system.transfer.items.push(item)
          }

          system.transfer.items.start?.(x, y)
        })
      },

      drag(x, y) {
        const res = setCurrentZone(x, y)
        if (res === false) return
        system.transfer.items.drag?.(x, y)
      },

      stop: async (x, y) => {
        const dropzone = system.transfer.currentZone?.target
        await forgetCurrentZone(x, y)
        if (this.config.useSelection && dropzone) {
          const selectable = dropzone[Trait.INSTANCES]?.selectable
          if (selectable) {
            selectable.setElements(
              system.transfer.items.map(({ target }) => target)
            )
          }
        }

        system.transfer.items.length = 0
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
