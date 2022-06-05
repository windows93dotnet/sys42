import Emitter from "../../fabric/class/Emitter.js"
import observe from "../../fabric/locator/observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"

const sep = "/"

export default class State extends Emitter {
  #update = { throttle: false }

  constructor(ctx, val = {}) {
    super()
    this.value = val

    this.queue = { paths: new Set(), lengths: new Set(), objects: new Set() }

    this.#update.now = () => {
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

      // console.group("--- update")
      // console.log(changes)
      // console.log(Object.keys(ctx.renderers))
      // console.groupEnd()

      this.queue.paths.clear()
      this.queue.lengths.clear()
      this.queue.objects.clear()

      this.deferred?.resolve()

      this.emit("update", changes)
    }

    this.#update.onrepaint = paintThrottle(this.#update.now)
    this.#update.fn = this.#update.now

    let updateDone = false
    this.update.done = async () => {
      await ctx.undones.done()
      const { paths, lengths, objects } = this.queue
      const hasQueue = paths.size > 0 || lengths.size > 0 || objects.size > 0
      if (hasQueue) await this.once("update")
      if (updateDone) return
      updateDone = true
      this.throttle = true
    }

    this.update.now = (path, val, oldVal) => {
      const { throttle } = this
      this.throttle = false
      this.update(path, val, oldVal)
      this.throttle = throttle
    }

    this.proxy = observe(this.value, {
      signal: ctx.cancel.signal,
      change: (path, val, oldVal) => {
        this.update(path, val, oldVal)
      },
      has(path, { key }) {
        if (key.startsWith("@") || key.startsWith("#")) return true
        return exists(ctx.el, key, sep) || ctx.computeds.has(path)
      },
      get(path, { key, chain, parent }) {
        if (key === "@index") return chain.at(-1)
        if (key === "@first") return Number(chain.at(-1)) === 0
        if (key === "@last") return Number(chain.at(-1)) === parent.length - 1
        if (key.startsWith("#")) return chain.at(-1).padStart(key.length, "0")
        return locate(ctx.el, key, sep) ?? ctx.computeds.get(path)
      },
    })
  }

  fork(ctx) {
    return new State(ctx, this.value)
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

  assign(path, value, options) {
    const prev = locate(options?.silent ? this.value : this.proxy, path, sep)
    Object.assign(prev, value)
  }
}
