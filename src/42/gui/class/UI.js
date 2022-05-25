import DOMQuery from "../../fabric/class/DOMQuery.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import clearElement from "../../ui/utils/clearElement.js"
import render from "../render.js"

export default class UI extends DOMQuery {
  constructor(...args) {
    super()
    if (args[0] instanceof Node || typeof args[0] === "string") {
      this.el = args[0]
      this.def = args[1]
      this._ctx = args[2]
    } else {
      this.el = document.body
      this.def = args[0]
      this._ctx = args[1]
    }
  }

  async mount(el = this.el, options) {
    this.el = ensureElement(el, { fragment: true })
    this.ctx = { ...this._ctx, ...options }

    clearElement(this.el)
    this.el.append(render(this.def, this.ctx))
    await this.ctx.undones

    this.state = this.ctx.state
    this.getAll("[data-autofocus]").at(-1)?.focus()
    return this
  }

  get data() {
    return this.state.proxy
  }
}
