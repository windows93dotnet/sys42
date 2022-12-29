import Trait from "../classes/Trait.js"
import movable from "./movable.js"
import settings from "../../core/settings.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import inIframe from "../../core/env/realm/inIframe.js"

import StackItemsHint from "./transferable2/StackItemsHint.js"
import IPCItemsHint from "./transferable2/IPCItemsHint.js"

const DEFAULTS = {
  selector: ":scope > *",
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

    const { selector } = this.config

    const itemsHint = inIframe
      ? new IPCItemsHint(this.config.hints.items)
      : new StackItemsHint(this.config.hints.items)

    this.movable = movable(this.el, {
      selector,
      autoScroll: true,
      start(x, y, draggeds) {
        return itemsHint.start?.(x, y, draggeds)
      },
      move(x, y, draggeds) {
        itemsHint.move?.(x, y, draggeds)
        return false
      },
      stop(x, y, draggeds) {
        return itemsHint.stop?.(x, y, draggeds)
      },
    })
  }
}

export function transferable(...args) {
  return new Transferable(...args)
}

export default transferable
