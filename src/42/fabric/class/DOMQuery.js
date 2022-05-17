// jQuery inspired class

import ensureElement from "../dom/ensureElement.js"

export default class DOMQuery {
  constructor(el = document.body) {
    this.el = ensureElement(el)
  }

  get(selector) {
    return this.el.querySelector(`:scope ${selector}`)
  }

  getAll(selector) {
    return [...this.el.querySelectorAll(`:scope ${selector}`)]
  }

  batch(selector) {
    return new Proxy(this.getAll(selector), {
      get(target, prop) {
        if (Reflect.has(target, prop)) return Reflect.get(target, prop)

        if (target.length === 0) return target

        if (target.some((x) => typeof x[prop] === "function")) {
          return (...args) => target.map((item) => item[prop]?.(...args))
        }

        return target.map((item) => item[prop])
      },
    })
  }
}
