import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import focus, { TabOrder } from "../../fabric/dom/focus.js"
import on from "../../fabric/event/on.js"
import noop from "../../fabric/type/function/noop.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"

const DEFAULTS = {
  selector: undefined,
  loop: false,
  remember: false,
  preventBlur: false,
  shortcuts: {
    next: "ArrowRight",
    prev: "ArrowLeft",
    first: "Home || PageUp",
    last: "End || PageDown",
    exitAfter: "Tab || Esc",
    exitBefore: "Shift+Tab",
  },
}

const configure = settings("ui.trait.navigable", DEFAULTS)

class Navigable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
    const { shortcuts } = this.config
    const { signal } = this.cancel

    if (this.config.selector) {
      this.config.selector = ensureScopeSelector(this.config.selector, this.el)
    }

    this.tabOrderOptions = {
      loop: this.config.loop,
      selector: this.config.selector,
    }

    if (this.config.selector) {
      this.tabOrder ??= new TabOrder(this.el, this.tabOrderOptions)
    }

    this.enabled = true
    let fromPointerdown

    const remember = this.config.remember
      ? (target = document.activeElement) => {
          if (this.el.contains(target)) {
            if (this.config.selector) {
              const el = target.closest(this.config.selector)
              if (el) {
                this.lastFocused = el
                return
              }
            }

            this.lastFocused = target
          }
        }
      : noop

    const blur = (target) => {
      remember(target)
      this.tabOrder = undefined
    }

    on(
      this.el,
      { signal },
      {
        "pointerdown"() {
          fromPointerdown = true
        },
        "pointerup || pointercancel"() {
          fromPointerdown = false
        },
        "focusout": (e) => {
          if (!this.el.contains(e.relatedTarget)) blur(e.target)
        },
        "focusin": (e) => {
          if (!this.enabled) return

          if (fromPointerdown) return void remember(e.target)
          if (!this.el.contains(e.relatedTarget)) {
            if (this.lastFocused && focus.attemptFocus(this.lastFocused)) return
            focus.first(this.el)
          }
        },
        "focus": this.config.preventBlur
          ? (e) => {
              if (
                !this.el.contains(e.relatedTarget) ||
                document.activeElement === this.el
              ) {
                if (this.lastFocused && focus.attemptFocus(this.lastFocused)) {
                  return
                }

                focus.first(this.el)
              }
            }
          : undefined,
      },
      {
        prevent: true,
        repeatable: true,

        [shortcuts.exitAfter]: () => {
          blur()
          focus.next(this.el)
        },
        [shortcuts.exitBefore]: () => {
          blur()
          focus.prev(this.el)
        },

        [shortcuts.next]: () => this.next(),
        [shortcuts.prev]: () => this.prev(),
        [shortcuts.first]: () => this.first(),
        [shortcuts.last]: () => this.last(),
      },
    )
  }

  next() {
    this.tabOrder ??= new TabOrder(this.el, this.tabOrderOptions)
    return this.tabOrder.next()
  }

  prev() {
    this.tabOrder ??= new TabOrder(this.el, this.tabOrderOptions)
    return this.tabOrder.prev()
  }

  first() {
    this.tabOrder ??= new TabOrder(this.el, this.tabOrderOptions)
    return this.tabOrder.first()
  }

  last() {
    this.tabOrder ??= new TabOrder(this.el, this.tabOrderOptions)
    return this.tabOrder.last()
  }

  focus(el) {
    this.enabled = false
    focus.autofocus(el)
    this.enabled = true
  }

  update() {
    this.tabOrder = undefined
  }
}

export function navigable(...args) {
  return new Navigable(...args)
}

export default navigable
