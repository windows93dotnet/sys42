import observe from "../observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"

const sep = "/"

export default class State {
  #update = {
    throttle: false,
  }

  constructor(ctx, val = {}) {
    this.value = val

    this.queue = {
      paths: new Set(),
      lengths: new Set(),
      objects: new Set(),
    }

    this.#update.now = () => {
      const changes = new Set()

      for (const { path, val, oldVal } of this.queue.lengths) {
        let i = val
        const l = oldVal
        for (; i < l; i++) {
          const key = `${path}/${i}`
          if (key in ctx.renderers) {
            for (const render of ctx.renderers[key]) render(key)
          }
        }
      }

      for (const path of this.queue.objects) {
        changes.add(path)
        for (const key of Object.keys(ctx.renderers)) {
          if (key.startsWith(path) && key in ctx.renderers) {
            for (const render of ctx.renderers[key]) render(key)
          }
        }
      }

      for (const path of this.queue.paths) {
        changes.add(path)
        if (path in ctx.renderers) {
          for (const render of ctx.renderers[path]) render(path)
        }
      }

      // this.emit("update", changes)

      // console.group("--- update")
      // console.log(changes)
      // console.log(Object.keys(ctx.renderers))
      // console.groupEnd()

      this.queue.paths.clear()
      this.queue.lengths.clear()
      this.queue.objects.clear()
    }

    this.#update.onrepaint = paintThrottle(this.#update.now)
    this.#update.fn = this.#update.now

    this.proxy = observe(this.value, {
      signal: ctx.cancel.signal,
      change: (path, val, oldVal) => {
        this.update(path, val, oldVal)
      },
      has(path) {
        return exists(ctx.el, path, sep)
      },
      get(path) {
        return locate(ctx.el, path, sep)
      },
    })
  }

  get throttle() {
    return this.#update.fn === this.#update.onrepaint
  }
  set throttle(value) {
    this.#update.throttle = value
    this.#update.fn = value ? this.#update.onrepaint : this.#update.now
  }

  update(path, val, oldVal) {
    if (path.endsWith("/length")) {
      path = path.slice(0, -7)
      this.queue.objects.add(path)
      this.queue.lengths.add({ path, val, oldVal })
    } else if (val && typeof val === "object") {
      this.queue.objects.add(path)
    } else {
      this.queue.paths.add(path)
    }

    this.#update.fn()
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
