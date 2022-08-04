// jQuery inspired class

import ensureElement from "../dom/ensureElement.js"
import waitFor from "../dom/waitFor.js"
import listen from "../dom/listen.js"
import Callabale from "./Callable.js"

export default class DOMQuery extends Callabale {
  constructor(el = document.body) {
    super((...args) => this.each(...args))
    this.el = ensureElement(el)
  }

  query(selector) {
    return this.el.querySelector(`:scope ${selector}`)
  }

  queryAll(selector) {
    return [...this.el.querySelectorAll(`:scope ${selector}`)]
  }

  each(selector, options) {
    const init = options?.live ? [] : this.queryAll(selector)
    return new Proxy(init, {
      get: (target, key, receiver) => {
        if (options?.live) {
          target.length = 0
          target.push(...this.el.querySelectorAll(`:scope ${selector}`))
        }

        if (Reflect.has(target, key)) return Reflect.get(target, key)

        if (target.length === 0) return target

        if (key === "on") {
          return (event, selector, fn) => {
            for (const item of target) {
              typeof selector === "function"
                ? listen(item, { [event]: selector })
                : listen(item, { selector, [event]: fn })
            }

            return receiver
          }
        }

        if (target.some((item) => typeof item[key] === "function")) {
          return (...args) => target.map((item) => item[key]?.(...args))
        }

        return target.map((item) => item[key])
      },

      set: (target, key, val) => {
        if (options?.live) {
          target.length = 0
          target.push(...this.el.querySelectorAll(`:scope ${selector}`))
        }

        let out = false
        for (const item of target) out ||= Reflect.set(item, key, val)
        return out
      },
    })
  }

  async waitFor(selector, options = {}) {
    options.parent = this.el
    return waitFor(selector, options)
  }

  on(event, selector, fn) {
    return typeof selector === "function"
      ? listen(this.el, { [event]: selector })
      : listen(this.el, { selector, [event]: fn })
  }
}
