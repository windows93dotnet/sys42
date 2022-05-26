import observe from "../observe.js"
import locate from "../../fabric/locator/locate.js"

export default class State {
  constructor(ctx) {
    this.value = {}
    this.proxy = observe(this.value, {
      change(prop) {
        if (prop in ctx.renderers) {
          for (const render of ctx.renderers[prop]) render()
        }
      },
    })
  }

  get(path) {
    return locate(this.proxy, path, "/")
  }

  assign(path, value) {
    const proxy = locate(this.proxy, path, "/")
    Object.assign(proxy, value)
  }
}
