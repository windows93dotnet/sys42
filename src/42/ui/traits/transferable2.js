import Trait from "../classes/Trait.js"
import Dragger from "../classes/Dragger.js"
import getRects from "../../fabric/dom/getRects.js"
import pick from "../../fabric/type/object/pick.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import inIframe from "../../core/env/realm/inIframe.js"

import StackItemsHint from "./transferable2/StackItemsHint.js"
import IPCItemsHint from "./transferable2/IPCItemsHint.js"

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
    const { signal } = this.cancel

    const itemsHint = inIframe
      ? new IPCItemsHint(this.config.hints.items)
      : new StackItemsHint(this.config.hints.items)

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
          itemsHint.start?.(x, y, this.items)
        })
      },

      drag: (x, y) => {
        itemsHint.drag?.(x, y, this.items)
      },

      stop: (x, y) => {
        itemsHint.stop?.(x, y, this.items)
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
