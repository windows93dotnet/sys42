// jQuery inspired class

import ensureElement from "../dom/ensureElement.js"
import listen from "../event/listen.js"
import Callabale from "./Callable.js"

export default class DOMQuery extends Callabale {
  constructor(el = document.documentElement) {
    super((/* DOMQuery.each */ ...args) => this.each(...args))
    this.el = ensureElement(el)
  }

  query(selector, base) {
    if (base) {
      base = ensureElement(base)
      if (base.localName === "iframe") base = base.contentDocument
    } else base = this.el

    return base.querySelector(`:scope ${selector}`)
  }

  queryAll(selector, base) {
    if (base) {
      base = ensureElement(base)
      if (base.localName === "iframe") base = base.contentDocument
    } else base = this.el

    return [...base.querySelectorAll(`:scope ${selector}`)]
  }

  each(selector, options) {
    const base =
      (typeof options === "string" || options?.nodeType === Node.ELEMENT_NODE
        ? options
        : options?.base) ?? this.el

    const init = options?.live
      ? []
      : [...base.querySelectorAll(`:scope ${selector}`)]

    return new Proxy(init, {
      get(target, key, receiver) {
        if (options?.live) {
          target.length = 0
          target.push(...base.querySelectorAll(`:scope ${selector}`))
        }

        // array methods/properties
        if (Reflect.has(target, key)) return Reflect.get(target, key)

        // events
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

        // fast return
        if (target.length === 0) return target

        // element native methods
        if (target.some((item) => typeof item[key] === "function")) {
          return (...args) => {
            const out = []
            for (const item of target) out.push(item[key]?.(...args))
            // if (out.every((x) => x === undefined)) return receiver
            return out
          }
        }

        // element native properties
        const out = []
        for (const item of target) out.push(item[key])
        return out
      },

      set(target, key, val) {
        if (options?.live) {
          target.length = 0
          target.push(...base.querySelectorAll(`:scope ${selector}`))
        }

        let out = false
        for (const item of target) out ||= Reflect.set(item, key, val)
        return out
      },
    })
  }

  on(event, selector, fn) {
    return typeof selector === "function"
      ? listen(this.el, { [event]: selector })
      : listen(this.el, { selector, [event]: fn })
  }
}
