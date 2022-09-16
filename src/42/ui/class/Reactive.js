import Emitter from "../../fabric/class/Emitter.js"
import observe from "../../fabric/locator/observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"
import deallocate from "../../fabric/locator/deallocate.js"
import defer from "../../fabric/type/promise/defer.js"
import dispatch from "../../fabric/event/dispatch.js"
import equal from "../../fabric/type/any/equal.js"
import merge from "../../fabric/type/object/merge.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"

const sep = "/"

export default class Reactive extends Emitter {
  #update = {}

  constructor(ctx, data = {}) {
    super({ signal: ctx.cancel.signal })
    ctx.cancel.signal.addEventListener("abort", () => this.destroy())

    this.ctx = ctx
    this.data = data
    this.firstUpdateDone = false

    Object.defineProperty(this.ctx, "state", {
      enumerable: true,
      get: () => this.state,
    })

    this.queue = {
      paths: new Set(),
      objects: new Set(),
    }

    const update = () => {
      const res = this.render(this.queue)
      this.#update.ready?.resolve?.()
      this.#update.ready = 0
      try {
        this.emit("update", ...res)
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

      change: (path, val, oldVal, deleted) => {
        this.update(path, val, oldVal, deleted)
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

  async done(n = 10) {
    await this.ctx.components.done()
    await this.ctx.undones.done()
    await this.#update.ready
    await 0 // queueMicrotask

    if (this.ctx.undones.length > 0 || this.ctx.components.length > 0) {
      if (n < 0) throw new Error("Too much recursion")
      await this.done(n--)
    }

    if (this.firstUpdateDone === false) this.setup()
  }

  async setup() {
    this.firstUpdateDone = true
    this.throttle = true
    await this.ctx.postrender.call()
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

  // eslint-disable-next-line max-params
  enqueue(queue, path, val, oldVal, deleted) {
    if (deleted) {
      const type = oldVal && typeof oldVal === "object" ? "objects" : "paths"
      queue[type].add([path, true])
    } else if (path.endsWith("/length")) {
      queue.objects.add([path.slice(0, -7)])
    } else if (val && typeof val === "object") {
      if (
        oldVal !== undefined &&
        "$ref" in val === false &&
        equal(val, oldVal)
      ) {
        return
      }

      queue.objects.add([path])
    } else {
      if (oldVal !== undefined && equal(val, oldVal)) return
      queue.paths.add([path])
    }
  }

  update(path, val, oldVal, deleted) {
    this.enqueue(this.queue, path, val, oldVal, deleted)
    this.#update.ready ||= defer()
    this.#update.fn()
  }

  render(queue) {
    const changes = new Set()
    const deleteds = new Set()

    for (const [path, deleted] of queue.objects) {
      changes.add(path)
      if (deleted) deleteds.add(path)
      for (const key of Object.keys(this.ctx.renderers)) {
        if (key.startsWith(path) && key in this.ctx.renderers) {
          for (const render of this.ctx.renderers[key]) render(key)
        }
      }
    }

    for (const [path, deleted] of queue.paths) {
      changes.add(path)
      if (deleted) deleteds.add(path)
      if (path in this.ctx.renderers) {
        for (const render of this.ctx.renderers[path]) render(path)
      }
    }

    // root renderers
    if (sep in this.ctx.renderers) {
      for (const render of this.ctx.renderers[sep]) render(sep)
    }

    // console.group("State Update")
    // console.log([...changes].join("\n"))
    // console.log("%c" + Object.keys(this.ctx.renderers).join("\n"), "color:#999")
    // console.groupEnd()

    queue.objects.clear()
    queue.paths.clear()

    return [changes, deleteds]
  }

  export(changes, deleteds) {
    const data = { add: [], remove: [] }
    for (const loc of changes) {
      if (deleteds.has(loc)) data.remove.push(loc)
      else data.add.push([loc, locate(this.data, loc, sep)])
    }

    return data
  }

  import({ add, remove }, ...rest) {
    const queue = {
      paths: new Set(),
      objects: new Set(),
    }

    for (const [loc, val] of add) {
      allocate(this.data, loc, val, sep)
      this.enqueue(queue, loc, val)
    }

    for (const loc of remove) {
      deallocate(this.data, loc, sep)
      this.enqueue(queue, loc, undefined, undefined, true)
    }

    const res = this.render(queue)

    try {
      this.emit("update", ...res, ...rest)
    } catch (err) {
      dispatch(this.ctx.el, err)
    }
  }

  has(path) {
    return exists(this.state, path, sep)
  }

  get(path, options) {
    return locate(options?.silent ? this.data : this.state, path, sep)
  }

  set(path, val, options) {
    allocate(options?.silent ? this.data : this.state, path, val, sep)
  }

  delete(path, options) {
    deallocate(options?.silent ? this.data : this.state, path, sep)
  }

  assign(path, val, options) {
    const prev = this.get(path, options)
    if (prev && typeof prev === "object") Object.assign(prev, val)
    else this.set(path, val, options)
  }

  merge(path, val, options) {
    const prev = this.get(path, options)
    if (prev && typeof prev === "object") merge(prev, val)
    else this.set(path, val, options)
  }

  destroy() {
    this.emit("destroy", this)
    this.off("*")
    this.queue.paths.clear()
    this.queue.objects.clear()
    this.#update.ready = false
    delete this.data
    delete this.state
    this.ctx.cancel("Reactive instance destroyed")
  }
}
