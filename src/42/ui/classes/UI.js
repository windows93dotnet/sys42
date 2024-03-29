import "../head.js"
import normalize from "../normalize.js"
import render from "../render.js"
import postrenderAutofocus from "../utils/postrenderAutofocus.js"
import ensureElement from "../../fabric/dom/ensureElement.js"

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
    this.stage.firstUpdateMade = false

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

    if (this.stage.firstUpdateMade === true) {
      await this.stage.pendingDone()
    } else {
      if (this.stage.waitlistPreload.length > 0) {
        await this.stage.waitlistPreload.done()
        delete this.stage.waitlistPreload
      }

      this.content = render(this.plan, this.stage, { skipNormalize: true })
      this.el.append(this.content)

      await this.stage.pendingDone()

      if (this.stage?.reactive) {
        this.stage.firstUpdateMade = true
        this.stage.reactive.throttle = true
        await this.stage.waitlistPostrender.call()
        delete this.stage.waitlistPostrender
      }

      if (this.stage?.tmp) {
        this.stage.tmp.clear()
        delete this.stage.tmp
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
    this.stage?.waitlistPreload?.clear()
    this.stage?.waitlistPending?.clear()
    this.stage?.waitlistPostrender?.clear()
    this.stage?.waitlistComponents?.clear()
    this.stage?.waitlistTraits?.clear()
    this.content?.remove?.()
    delete this.stage
    delete this.plan
    delete this.el
  }
}
