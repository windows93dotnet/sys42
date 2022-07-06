import DOMQuery from "../../fabric/class/DOMQuery.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import asyncable from "../../fabric/trait/asyncable.js"
import hash from "../../fabric/type/any/hash.js"
import render from "../render.js"

export default class UI extends DOMQuery {
  constructor(...args) {
    super()

    if (args[0] instanceof Node || typeof args[0] === "string") {
      this.el = ensureElement(args[0], { fragment: true })
      this.def = args[1]
      this.ctx = args[2] ?? {}
    } else {
      this.el = document.body
      this.def = args[0]
      this.ctx = args[1] ?? {}
    }

    this.ctx.el = this.el
    this.ctx.badge = hash(this.def)
    // this.ctx.persist ??= true

    this.el.append(render(this.def, this.ctx))

    let firstUpdateDone = false

    asyncable(this, async () => {
      if (!this.ctx) return
      await this.ctx.components.done()
      await this.ctx.reactive.ready()
      if (firstUpdateDone) return
      firstUpdateDone = true
      this.ctx.reactive.throttle = true
      this.queryAll("[data-autofocus]").at(-1)?.focus()
    })
  }

  get reactive() {
    return this.ctx.reactive
  }
  get data() {
    return this.ctx.reactive.data
  }
  get state() {
    return this.ctx.reactive.state
  }

  destroy() {
    this.ctx.cancel("ui destroyed")
    delete this.ctx
    delete this.def
    delete this.el
  }

  get [Symbol.toStringTag]() {
    return "UI"
  }
}
