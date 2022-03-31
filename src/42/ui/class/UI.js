import DOMQuery from "../../fabric/class/DOMQuery.js"
import render from "../render.js"
import makeNewContext from "../utils/makeNewContext.js"
import clearElement from "../utils/clearElement.js"
import ensureElement from "../../fabric/dom/ensureElement.js"

export default class UI extends DOMQuery {
  constructor(...args) {
    super()
    if (args[0] instanceof Node || typeof args[0] === "string") {
      this.el = args[0]
      this.def = args[1]
      this.ctx = args[2]
    } else {
      this.el = document.body
      this.def = args[0]
      this.ctx = args[1]
    }
  }

  async mount(el = this.el, options) {
    this.el = ensureElement(el, { fragment: true })

    const level = this.def.level
      ? this.def.level
      : this.el === document.body
      ? 1
      : 2

    this.ctx = makeNewContext({ level, ...this.ctx, ...options })
    this.ctx.global.state.ui = this

    clearElement(el)

    this.el.append(render(this.def, this.ctx))
    await this.ctx.undones

    this.state = this.ctx.global.state

    this.run = this.ctx.global.actions.value

    this.getAll("[data-autofocus]").at(-1)?.focus()

    return this
  }

  get data() {
    return this.state.proxy
  }
  set data(value) {
    const type = typeof value
    if (value && type === "object") this.state.value = value
    else throw new TypeError(`data must be an array or object: ${type}`)
  }

  destroy() {
    clearElement(this.el)
    this.ctx.cancel()
    delete this.state
    delete this.ctx
  }

  get [Symbol.toStringTag]() {
    return "UI"
  }
}
