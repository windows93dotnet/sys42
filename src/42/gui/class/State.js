import observe from "../observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"

const sep = "/"

export default class State {
  constructor(ctx, val = {}) {
    this.value = val
    this.proxy = observe(this.value, {
      signal: ctx.cancel.signal,
      change(path) {
        if (path in ctx.renderers) {
          for (const render of ctx.renderers[path]) render()
        }
      },
      has(path) {
        return exists(ctx.el, path, sep)
      },
      get(path) {
        return locate(ctx.el, path, sep)
      },
    })
  }

  fork(ctx) {
    return new State(ctx, this.value)
  }

  has(path) {
    return exists(this.proxy, path, sep)
  }

  get(path) {
    return locate(this.proxy, path, sep)
  }

  set(path, val) {
    return allocate(this.proxy, path, val, sep)
  }

  assign(path, value) {
    const proxy = locate(this.proxy, path, sep)
    Object.assign(proxy, value)
  }
}
