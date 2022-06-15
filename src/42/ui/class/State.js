import Emitter from "../../fabric/class/Emitter.js"
import observe from "../../fabric/locator/observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"
import deallocate from "../../fabric/locator/deallocate.js"
import defer from "../../fabric/type/promise/defer.js"
import dispatch from "../../fabric/dom/dispatch.js"
import equal from "../../fabric/type/any/equal.js"
import idleThrottle from "../../fabric/type/function/idleThrottle.js"

const FPS = 1000 / 60
const sep = "/"

export default class State extends Emitter {
  #update = {}

  constructor(ctx, val = {}) {
    super()
    this.value = val
    this.ctx = ctx

    this.queue = {
      paths: new Set(),
      objects: new Set(),
    }

    const update = () => {
      const changes = new Set()

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

    this.#update.onrepaint = idleThrottle(update, FPS)
    this.#update.now = update
    this.#update.fn = this.#update.now
    this.#update.ready = false

    this.proxy = observe(this.value, {
      signal: ctx.cancel.signal,
      change: (path, val, oldVal, detail) => {
        this.update(path, val, oldVal, detail)
      },
      delete: (path, { key }) => {
        this.emit("delete", key)
      },
      locate: (ref) => locate(this.proxy, ref, sep),
      has(path, { key }) {
        if (key.startsWith("@") || key.startsWith("#")) return true
        if (ctx.computeds.has(path)) return true
        return false
      },
      get(path, { key, chain, parent }) {
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

        if (ctx.computeds.has(path)) return ctx.computeds.get(path)
      },
    })
  }

  async ready(n = 10) {
    await this.ctx.undones.done()
    await this.#update.ready

    if (this.ctx.undones.length > 0) {
      if (n < 0) throw new Error("Too much recursion")
      await this.ready(n--)
    }
  }

  get throttle() {
    return this.#update.fn === this.#update.onrepaint
  }
  set throttle(value) {
    this.#update.fn = value ? this.#update.onrepaint : this.#update.now
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
    return exists(this.proxy, path, sep)
  }

  get(path, options) {
    return locate(options?.silent ? this.value : this.proxy, path, sep)
  }

  set(path, val, options) {
    return allocate(options?.silent ? this.value : this.proxy, path, val, sep)
  }

  delete(path, options) {
    return deallocate(options?.silent ? this.value : this.proxy, path, sep)
  }

  assign(path, value, options) {
    const prev = locate(options?.silent ? this.value : this.proxy, path, sep)
    Object.assign(prev, value)
  }
}
