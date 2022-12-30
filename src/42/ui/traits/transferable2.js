import Trait from "../classes/Trait.js"
import Dragger from "../classes/Dragger.js"
import getRects from "../../fabric/dom/getRects.js"
import pick from "../../fabric/type/object/pick.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import makeHints from "./transferable2/makeHints.js"
import "./transferable2/ipcItemsHint.js"

const DEFAULTS = {
  selector: ":scope > *",
  handlerSelector: undefined,
  autoScroll: true,
  useSelection: true,
  useTargetOffset: true,
  hints: {
    items: {
      name: "stack",
      animateFromSpeed: 180,
      animateToSpeed: 180,
    },
  },
}

const configure = settings("ui.trait.transferable", DEFAULTS)

class Transferable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    this.config.selector = ensureScopeSelector(this.config.selector, this.el)

    if (typeof this.config.hints.items === "string") {
      this.config.hints.items = { name: this.config.hints.items }
    }

    this.items = []

    this.init()
  }

  async init() {
    const { signal } = this.cancel

    this.hints = await makeHints(this.config.hints)

    this.dragger = new Dragger(this.el, {
      signal,

      ...pick(this.config, [
        "selector",
        "autoScroll",
        "useSelection",
        "useTargetOffset",
      ]),

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
            targets = elements
          } else targets = [target]
        } else targets = [target]

        this.items.length = 0

        getRects(targets).then((items) => {
          this.items.push(...items)
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
