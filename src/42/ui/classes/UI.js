import "../head.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import render from "../render.js"
import normalize from "../normalize.js"
import postrenderAutofocus from "../postrenderAutofocus.js"

export default class UI {
  constructor(...args) {
    if (args[0] instanceof Element || typeof args[0] === "string") {
      this.el = ensureElement(args[0])
      this.plan = args[1]
      this.stage = args[2] ?? {}
    } else {
      this.el = document.body
      this.plan = args[0]
      this.stage = args[1] ?? {}
    }

    this.stage.el = this.el
    this.stage.steps = "root"

    const [plan, stage] = normalize(this.plan, this.stage)
    this.plan = plan
    this.stage = stage

    this.stage.postrender.push(() => {
      postrenderAutofocus(this.el)
    })

    this.ready = this.done()
  }

  async done() {
    if (this.ready) return this.ready
    if (!this.stage) return

    if (this.stage.reactive.firstUpdateDone !== true) {
      if (this.stage.preload.length > 0) await this.stage.preload.done()
      this.content = render(this.plan, this.stage, { skipNormalize: true })
      this.el.append(this.content)
    }

    await this.stage.reactive.done()
    this.ready = undefined
  }

  get reactive() {
    return this.stage.reactive
  }
  get data() {
    return this.stage.reactive.data
  }
  get state() {
    return this.stage.reactive.state
  }
  get run() {
    return this.stage.actions.value
  }

  destroy() {
    this.stage?.cancel("ui destroyed")
    this.stage?.preload.clear()
    this.stage?.components.clear()
    this.stage?.undones.clear()
    this.stage?.postrender.clear()
    this.content?.remove?.()
    delete this.stage
    delete this.plan
    delete this.el
  }
}
