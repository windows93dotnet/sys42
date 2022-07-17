import DOMQuery from "../../fabric/class/DOMQuery.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import asyncable from "../../fabric/trait/asyncable.js"
import render from "../render.js"
import normalize from "../normalize.js"

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

    const [def, ctx] = normalize(this.def, this.ctx)
    this.def = def
    this.ctx = ctx

    asyncable(this, async () => {
      if (!this.ctx) return

      if (this.ctx.reactive.firstUpdateDone !== true) {
        if (this.ctx.preload.length > 0) await this.ctx.preload.done()
        this.el.append(render(this.def, this.ctx, { skipNormalize: true }))
      }

      await this.ctx.components.done()
      await this.ctx.reactive.done()
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
    this.ctx?.cancel("ui destroyed")
    delete this.ctx
    delete this.def
    delete this.el
  }

  get [Symbol.toStringTag]() {
    return "UI"
  }
}
