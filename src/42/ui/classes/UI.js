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

    this.stage.waitlistPostrender.push(() => {
      postrenderAutofocus(this.el)
    })

    this.ready = this.done()
  }

  async done() {
    if (this.ready) return this.ready
    if (!this.stage) return

    if (this.stage.reactive.firstUpdateDone === true) {
      await this.stage.waitPending()
    } else {
      if (this.stage.waitlistPreload.length > 0) {
        await this.stage.waitlistPreload.done()
      }

      this.content = render(this.plan, this.stage, { skipNormalize: true })
      this.el.append(this.content)

      await this.stage.waitPending()

      if (this.stage?.reactive) {
        this.stage.reactive.firstUpdateDone = true
        this.stage.reactive.throttle = true
        await this.stage.waitlistPostrender.call()
      }
    }

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
    this.stage?.waitlistPreload.clear()
    this.stage?.waitlistComponents.clear()
    this.stage?.waitlistPrerender.clear()
    this.stage?.waitlistPostrender.clear()
    this.content?.remove?.()
    delete this.stage
    delete this.plan
    delete this.el
  }
}
