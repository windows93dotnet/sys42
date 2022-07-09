import Emitter from "../../fabric/class/Emitter.js"
import observe from "../../fabric/locator/observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"
import deallocate from "../../fabric/locator/deallocate.js"
import defer from "../../fabric/type/promise/defer.js"
import dispatch from "../../fabric/dom/dispatch.js"
import equal from "../../fabric/type/any/equal.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"

const sep = "/"

export default class Reactive extends Emitter {
  #setuped = false
  #update = {}

  constructor(ctx, data = {}) {
    super()

    this.ctx = ctx
    this.data = data

    Object.defineProperty(this.ctx, "state", {
      enumerable: true,
      get: () => this.state,
    })

    this.queue = {
      paths: new Set(),
      objects: new Set(),
    }

    const update = () => {
      const changes = new Set()

      for (const path of this.queue.objects) {
        changes.add(path)
        for (const key of Object.keys(this.ctx.renderers)) {
          if (key.startsWith(path) && key in this.ctx.renderers) {
            for (const render of this.ctx.renderers[key]) render(key)
          }
        }
      }

      for (const path of this.queue.paths) {
        changes.add(path)
        if (path in this.ctx.renderers) {
          for (const render of this.ctx.renderers[path]) render(path)
        }
      }

      // console.group("State Update")
      // console.log([...changes].join("\n"))
      // console.log("%c" + Object.keys(ctx.renderers).join("\n"), "color:#999")
      // console.groupEnd()

      this.queue.paths.clear()
      this.queue.objects.clear()

      this.#update.ready?.resolve?.()
      this.#update.ready = 0

      try {
        this.emit("update", changes)
      } catch (err) {
        dispatch(ctx.el, err)
      }
    }

    this.#update.onrepaint = paintThrottle(update)
    this.#update.now = update
    this.#update.fn = this.#update.now
    this.#update.ready = false

    this.state = observe(this.data, {
      signal: this.ctx.cancel.signal,

      locate: (ref) => locate(this.state, ref, sep),

      change: (path, val, oldVal, detail) => {
        this.update(path, val, oldVal, detail)
      },

      delete: (path, { key }) => {
        this.emit("delete", key)
      },

      has: (path, { key }) => {
        if (key.startsWith("@") || key.startsWith("#")) return true
        if (this.ctx.computeds.has(path)) return true
        return false
      },

      get: (path, { key, chain, parent }) => {
        if (key.startsWith("@") || key.startsWith("#")) {
          const parts = key.split(":")
          if (key.startsWith("#")) {
            return parts[1].padStart(parts[0].length, "0")
          }

          const index = Number(parts[1])
          if (key.startsWith("@index")) return index
          if (key.startsWith("@first")) return index === 0
          if (key.startsWith("@last")) {
            return index === parent[chain.at(-1)].length - 1
          }
        }

        if (this.ctx.computeds.has(path)) return this.ctx.computeds.get(path)
      },
    })
  }

  setup() {
    if (this.#setuped) return
    this.#setuped = true

    for (const plugin of this.ctx.plugins) {
      this.ctx.undones.push(plugin(this.ctx))
    }
  }

  async done(n = 10) {
    await this.ctx.undones.done()
    await this.#update.ready
    await 0 // queueMicrotask

    if (this.ctx.undones.length > 0) {
      if (n < 0) throw new Error("Too much recursion")
      await this.done(n--)
    }
  }

  get throttle() {
    return this.#update.fn === this.#update.onrepaint
  }
  set throttle(val) {
    this.#update.fn = val ? this.#update.onrepaint : this.#update.now
  }

  now(cb) {
    const { throttle } = this
    this.throttle = false
    cb()
    this.throttle = throttle
  }

  updateNow(path, val) {
    const { throttle } = this
    this.throttle = false
    this.update(path, val)
    this.throttle = throttle
  }

  update(path, val, oldVal) {
    if (path.endsWith("/length")) {
      this.queue.objects.add(path.slice(0, -7))
    } else if (val && typeof val === "object") {
      if (
        oldVal !== undefined &&
        "$ref" in val === false &&
        equal(val, oldVal)
      ) {
        return
      }

      this.queue.objects.add(path)
    } else {
      if (oldVal !== undefined && equal(val, oldVal)) return
      this.queue.paths.add(path)
    }

    this.#update.ready ||= defer()
    this.#update.fn()
  }

  has(path) {
    return exists(this.state, path, sep)
  }

  get(path, options) {
    return locate(options?.silent ? this.data : this.state, path, sep)
  }

  set(path, val, options) {
    return allocate(options?.silent ? this.data : this.state, path, val, sep)
  }

  delete(path, options) {
    return deallocate(options?.silent ? this.data : this.state, path, sep)
  }

  assign(path, val, options) {
    const prev = locate(options?.silent ? this.data : this.state, path, sep)
    Object.assign(prev, val)
  }
}
