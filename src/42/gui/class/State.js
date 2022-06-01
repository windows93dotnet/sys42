import observe from "../observe.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"

export default class State {
  constructor(ctx) {
    this.value = {}
    this.proxy = observe(this.value, {
      change(path) {
        if (path in ctx.renderers) {
          for (const render of ctx.renderers[path]) render()
        }
      },
    })
  }

  set(path, val) {
    return allocate(this.proxy, path, val, "/")
  }

  get(path) {
    return locate(this.proxy, path, "/")
  }

  assign(path, value) {
    const proxy = locate(this.proxy, path, "/")
    Object.assign(proxy, value)
  }
}
