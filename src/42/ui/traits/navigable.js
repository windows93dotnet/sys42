/* eslint-disable object-shorthand */
import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import focus, { TabOrder } from "../../fabric/dom/focus.js"
import on from "../../fabric/event/on.js"
import noop from "../../fabric/type/function/noop.js"

const DEFAULTS = {
  selector: undefined,
  loop: !false,
  remember: !false,
  shortcuts: {
    next: "ArrowRight",
    prev: "ArrowLeft",
    first: "Home || PageUp",
    last: "End || PageDown",
  },
}

const configure = settings("ui.trait.navigable", DEFAULTS)

class Navigable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)

    this.el.tabIndex = -1

    const { shortcuts } = this.config

    const { signal } = this.cancel
    const tabOrderOptions = { loop: this.config.loop }

    let fromPointerdown

    const remember = this.config.remember
      ? (target = document.activeElement) => {
          if (this.el.contains(target)) this.lastFocused = target
        }
      : noop

    const blur = (target) => {
      remember(target)
      this.list = undefined
    }

    on(
      this.el,
      { signal },
      {
        "pointerdown": () => {
          fromPointerdown = true
        },
        "pointerup || pointercancel": () => {
          fromPointerdown = false
        },
        "focusout": (e) => {
          if (!this.el.contains(e.relatedTarget)) blur(e.target)
        },
        "focusin": (e) => {
          if (fromPointerdown) return void remember(e.target)
          if (!this.el.contains(e.relatedTarget)) {
            if (this.lastFocused && focus.attemptFocus(this.lastFocused)) return
            focus.first(this.el)
          }
        },
        "focus": (e) => {
          if (
            !this.el.contains(e.relatedTarget) ||
            document.activeElement === this.el
          ) {
            if (this.lastFocused && focus.attemptFocus(this.lastFocused)) return
            focus.first(this.el)
          }
        },
      },
      {
        "prevent": true,

        "Tab": () => {
          blur()
          focus.next(this.el, this.el.parentElement)
        },
        "Shift+Tab": () => {
          blur()
          focus.prev(this.el, this.el.parentElement)
        },

        [shortcuts.next]: () => {
          this.list ??= new TabOrder(this.el, tabOrderOptions)
          this.list.next()
        },
        [shortcuts.prev]: () => {
          this.list ??= new TabOrder(this.el, tabOrderOptions)
          this.list.prev()
        },
        [shortcuts.first]: () => {
          this.list ??= new TabOrder(this.el, tabOrderOptions)
          this.list.first()
        },
        [shortcuts.last]: () => {
          this.list ??= new TabOrder(this.el, tabOrderOptions)
          this.list.last()
        },
      }
    )
  }

  update() {
    this.list = undefined
  }
}

export function navigable(...args) {
  return new Navigable(...args)
}

export default navigable
