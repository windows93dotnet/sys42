import ensureElement from "../../fabric/dom/ensureElement.js"
import asyncable from "../../fabric/traits/asyncable.js"
import render from "../render.js"
import normalize from "../normalize.js"

export default class UI {
  constructor(...args) {
    if (args[0] instanceof Element || typeof args[0] === "string") {
      this.el = ensureElement(args[0])
      this.def = args[1]
      this.ctx = args[2] ?? {}
    } else {
      this.el = document.body
      this.def = args[0]
      this.ctx = args[1] ?? {}
    }

    this.ctx.el = this.el
    this.ctx.steps = "root"

    const [def, ctx] = normalize(this.def, this.ctx)
    this.def = def
    this.ctx = ctx

    this.ctx.postrender.push(() =>
      [...this.el.querySelectorAll(":scope [data-autofocus]")].at(-1)?.focus()
    )

    asyncable(this, async () => {
      if (!this.ctx) return

      if (this.ctx.reactive.firstUpdateDone !== true) {
        if (this.ctx.preload.length > 0) await this.ctx.preload.done()
        this.el.append(render(this.def, this.ctx, { skipNormalize: true }))
      }

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
    this.ctx?.preload.clear()
    this.ctx?.components.clear()
    this.ctx?.undones.clear()
    this.ctx?.postrender.clear()
    delete this.ctx
    delete this.def
    delete this.el
  }
}
