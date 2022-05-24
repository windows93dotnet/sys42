import render from "../render.js"

export default class UI {
  constructor(def) {
    this.ctx = {}
    this.el = render(def, this.ctx)
  }

  get state() {
    return this.ctx.state.proxy
  }
}
