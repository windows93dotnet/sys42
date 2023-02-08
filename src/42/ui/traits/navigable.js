import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import focus, { TabOrder } from "../../fabric/dom/focus.js"
import on from "../../fabric/event/on.js"

const DEFAULTS = {
  selector: undefined,
  loop: true,
  remember: true,
}

const configure = settings("ui.trait.navigable", DEFAULTS)

class Navigable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)

    const { signal } = this.cancel
    const tabOrderOptions = { loop: this.config.loop }

    this.el.tabIndex = -1

    let list
    let remember

    on(this.el, {
      signal,
      "disrupt": true,

      "focusin": (e) => {
        if (!this.el.contains(e.relatedTarget)) {
          let ok
          if (remember) ok = focus.attemptFocus(remember)
          if (ok !== true) focus.first(this.el)
        }
      },

      "Tab": () => {
        if (this.config.remember && this.el.contains(document.activeElement)) {
          remember = document.activeElement
        }

        focus.next(this.el, this.el.parentElement)
      },
      "Shift+Tab": () => {
        if (this.config.remember && this.el.contains(document.activeElement)) {
          remember = document.activeElement
        }

        focus.prev(this.el, this.el.parentElement)
      },

      "ArrowRight": () => {
        list ??= new TabOrder(this.el, tabOrderOptions)
        list.next()
      },
      "ArrowLeft": () => {
        list ??= new TabOrder(this.el, tabOrderOptions)
        list.prev()
      },
    })
  }
}

export function navigable(...args) {
  return new Navigable(...args)
}

export default navigable
