import Emitter from "../../fabric/class/Emitter.js"
import observe from "../../fabric/locator/observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"
import deallocate from "../../fabric/locator/deallocate.js"
import defer from "../../fabric/type/promise/defer.js"
import idleThrottle from "../../fabric/type/function/idleThrottle.js"

const FPS = 1000 / 60
const sep = "/"

export default class State extends Emitter {
  #update = {}

  constructor(ctx, val = {}) {
    super()
    this.value = val
    this.ctx = ctx

    this.queue = { paths: new Set(), lengths: new Set(), objects: new Set() }

    const updateFn = () => {
      const changes = new Set()

      for (const { path, val, oldVal } of this.queue.lengths) {
        let i = val
        const l = oldVal
        for (; i < l; i++) {
          const key = `${path}/${i}`
          changes.add(key)
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

      // console.group("State Update")
      // console.log([...changes].join("\n"))
      // console.log("%c" + Object.keys(ctx.renderers).join("\n"), "color:#999")
      // console.groupEnd()

      this.queue.paths.clear()
      this.queue.lengths.clear()
      this.queue.objects.clear()

      this.#update.ready?.resolve?.()
      this.#update.ready = 0

      try {
        this.emit("update", changes)
      } catch (err) {
        console.log(err)
      }
    }

    this.#update.onrepaint = idleThrottle(updateFn, FPS)
    // this.#update.now = idleThrottle(updateFn)
    this.#update.now = updateFn
    this.#update.fn = this.#update.now
    this.#update.ready = false

    this.proxy = observe(this.value, {
      signal: ctx.cancel.signal,
      change: (path, val, oldVal) => {
        this.update(path, val, oldVal)
      },
      delete: (path, { key }) => {
        this.emit("delete", key)
      },
      has(path, { key }) {
        if (key.startsWith("@") || key.startsWith("#")) return true
        return ctx.computeds.has(path)
      },
      get(path, { key, chain, parent }) {
        if (key === "@index") return chain.at(-1)
        if (key === "@first") return Number(chain.at(-1)) === 0
        if (key === "@last") return Number(chain.at(-1)) === parent.length - 1
        if (key.startsWith("#")) return chain.at(-1).padStart(key.length, "0")
        return ctx.computeds.get(path)
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

  updateNow(path, val, oldVal) {
    const { throttle } = this
    this.throttle = false
    this.update(path, val, oldVal)
    this.throttle = throttle
  }

  update(path, val, oldVal) {
    this.#update.ready ||= defer()

    if (path.endsWith("/length")) {
      path = path.slice(0, -7)
      this.queue.objects.add(path)
      this.queue.lengths.add({ path, val, oldVal })
    } else if (val && typeof val === "object") {
      this.queue.objects.add(path)
    } else this.queue.paths.add(path)

    this.#update.fn()
  }

  has(path) {
    return exists(this.proxy, path, sep)
  }

  get(path) {
    return locate(this.proxy, path, sep)
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
