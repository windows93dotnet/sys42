// import create from "../create.js"
import render from "../render.js"
import State from "./State.js"
import traverse from "../../fabric/type/object/traverse.js"
import template from "../../system/formats/template.js"
import Canceller from "../../fabric/class/Canceller.js"

export default class UI {
  constructor(def) {
    this.ctx = {
      scope: "",
      renderers: {},
      cancel: new Canceller(),
    }

    this.ctx.state = new State(this.ctx)

    traverse(def, (key, val, obj) => {
      if (typeof val === "string") {
        const parsed = template.parse(val)
        if (parsed.substitutions.length > 0) {
          obj[key] = template.compile(parsed)
          obj[key].parsed = parsed
        }
      }

      if (key === "data") {
        Object.assign(this.ctx.state.value, val)
      }
    })

    this.el = render(def, this.ctx)
  }

  get state() {
    return this.ctx.state.proxy
  }
}
