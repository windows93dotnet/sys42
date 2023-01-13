import "../head.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import asyncable from "../../fabric/traits/asyncable.js"
import render from "../render.js"
import normalize from "../normalize.js"
import postrenderAutofocus from "../postrenderAutofocus.js"

export default class UI {
  constructor(...args) {
    if (args[0] instanceof Element || typeof args[0] === "string") {
      this.el = ensureElement(args[0])
      this.plan = args[1]
      this.ctx = args[2] ?? {}
    } else {
      this.el = document.body
      this.plan = args[0]
      this.ctx = args[1] ?? {}
    }

    this.ctx.el = this.el
    this.ctx.steps = "root"

    const [plan, ctx] = normalize(this.plan, this.ctx)
    this.plan = plan
    this.ctx = ctx

    this.ctx.postrender.push(() => {
      postrenderAutofocus(this.el)
    })

    asyncable(this, async () => {
      if (!this.ctx) return

      if (this.ctx.reactive.firstUpdateDone !== true) {
        if (this.ctx.preload.length > 0) await this.ctx.preload.done()
        this.content = render(this.plan, this.ctx, { skipNormalize: true })
        this.el.append(this.content)
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
  get run() {
    return this.ctx.actions.value
  }

  destroy() {
    this.ctx?.cancel("ui destroyed")
    this.ctx?.preload.clear()
    this.ctx?.components.clear()
    this.ctx?.undones.clear()
    this.ctx?.postrender.clear()
    this.content?.remove?.()
    delete this.ctx
    delete this.plan
    delete this.el
  }
}
