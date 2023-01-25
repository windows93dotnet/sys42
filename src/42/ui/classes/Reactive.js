/* eslint-disable max-depth */
import Emitter from "../../fabric/classes/Emitter.js"
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
import isSerializable from "../../fabric/type/any/is/isSerializable.js"
import register from "../register.js"

const delimiter = "/"

export default class Reactive extends Emitter {
  #update = {}

  constructor(stage, data = {}) {
    super({ signal: stage.cancel.signal })
    stage.cancel.signal.addEventListener("abort", () => this.destroy())

    this.stage = stage
    this.data = data
    this.firstUpdateDone = false
    this.bypassEqualCheck = false

    Object.defineProperty(this.stage, "state", {
      enumerable: true,
      get: () => this.state,
    })

    this.queue = {
      paths: new Set(),
      objects: new Set(),
    }

    const update = () => {
      try {
        this.emit("queue", this.queue)
      } catch (err) {
        dispatch(stage.el, err)
      }

      if (this.queue.objects.size === 0 && this.queue.paths.size === 0) {
        this.pendingUpdate?.resolve?.()
        this.pendingUpdate = false
        return
      }

      const res = this.render(this.queue)
      this.pendingUpdate?.resolve?.()
      this.pendingUpdate = false

      try {
        this.emit("update", ...res)
      } catch (err) {
        dispatch(stage.el, err)
      }
    }

    this.#update.onrepaint = paintThrottle(update)
    this.#update.now = update
    this.#update.fn = this.#update.now
    this.pendingUpdate = false

    this.state = observe(this.data, {
      signal: this.stage.cancel.signal,

      locate: (ref) => locate(this.state, ref, delimiter),

      change: (path, val, oldVal, deleted) => {
        // console.log(path, val, oldVal, deleted)
        this.update(path, val, oldVal, deleted)
      },

      has: (path, { key }) => {
        if (key.startsWith("@") || key.startsWith("#")) return true
        if (exists(this.data, `$computed${path}`, delimiter)) return true
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

        if (exists(this.data, `$computed${path}`, delimiter)) {
          return locate(this.state, `$computed${path}`, delimiter)
        }
      },
    })
  }

  async done(n = 10) {
    await Promise.all([this.stage.components.done(), this.stage.undones.done()])
    await this.pendingUpdate
    await 0 // queueMicrotask

    if (this.stage.undones.length > 0 || this.stage.components.length > 0) {
      if (n < 0) throw new Error("Too much recursion")
      await this.done(n--)
    }

    if (this.firstUpdateDone === false) {
      this.firstUpdateDone = true
      this.throttle = true
      await this.stage.postrender.call()
    }
  }

  get throttle() {
    return this.#update.fn === this.#update.onrepaint
  }
  set throttle(val) {
    this.#update.fn = val ? this.#update.onrepaint : this.#update.now
  }

  setThrottle(val) {
    this.throttle = val
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

  refresh(path) {
    const { bypassEqualCheck } = this
    this.bypassEqualCheck = true
    const val = locate(this.data, path, delimiter)
    if (val?.$ref) this.update(val.$ref, locate(this.data, val.$ref, delimiter))
    else this.update(path, val)
    this.bypassEqualCheck = bypassEqualCheck
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
        !this.bypassEqualCheck &&
        equal(val, oldVal)
      ) {
        return
      }

      queue.objects.add([path])
    } else {
      if (
        oldVal !== undefined &&
        !this.bypassEqualCheck &&
        equal(val, oldVal)
      ) {
        return
      }

      queue.paths.add([path])
    }
  }

  update(path, val, oldVal, deleted) {
    this.pendingUpdate ||= defer()
    this.enqueue(this.queue, path, val, oldVal, deleted)
    this.#update.fn()
  }

  render(queue) {
    const changes = new Set()
    const deleteds = new Set()

    const rendered = new WeakSet()

    for (const [path, deleted] of queue.objects) {
      changes.add(path)
      if (deleted) deleteds.add(path)
      for (const key in this.stage.renderers) {
        if (key.startsWith(path)) {
          for (const render of this.stage.renderers[key]) {
            if (rendered.has(render)) continue
            render(key)
            rendered.add(render)
          }
        }
      }
    }

    for (const [path, deleted] of queue.paths) {
      changes.add(path)
      if (deleted) deleteds.add(path)
      if (path in this.stage.renderers) {
        for (const render of this.stage.renderers[path]) {
          if (rendered.has(render)) continue
          render(path)
          rendered.add(render)
        }
      }
    }

    // root renderers
    if (delimiter in this.stage.renderers) {
      for (const render of this.stage.renderers[delimiter]) {
        if (rendered.has(render)) continue
        render(delimiter)
        rendered.add(render)
      }
    }

    // console.group("State Update", { inTop: window.top === window.self })
    // // console.log(queue)
    // console.log([...changes].join("\n"))
    // console.log("%c" + Object.keys(this.stage.renderers).join("\n"), "color:#999")
    // console.groupEnd()

    queue.objects.clear()
    queue.paths.clear()

    return [changes, deleteds]
  }

  export(changes, deleteds) {
    // TODO: find a way to export only necessary data (e.g. using a keyword list in ui definition)
    const data = { add: [], remove: [] }
    for (const loc of changes) {
      if (deleteds.has(loc)) data.remove.push(loc)
      else {
        const res = locate(this.data, loc, delimiter)
        if (isSerializable(res)) data.add.push([loc, res])
      }
    }

    return data
  }

  import({ add, remove }, ...rest) {
    const queue = {
      paths: new Set(),
      objects: new Set(),
    }

    for (const loc of remove) {
      deallocate(this.data, loc, delimiter)
      this.enqueue(queue, loc, undefined, undefined, true)
    }

    for (const [loc, val] of add) {
      const prev = locate(this.data, loc, delimiter)
      if (prev && typeof prev === "object") Object.assign(prev, val)
      else allocate(this.data, loc, val, delimiter)
      this.enqueue(queue, loc, val)
    }

    const res = this.render(queue)

    try {
      this.emit("update", ...res, ...rest)
    } catch (err) {
      dispatch(this.stage.el, err)
    }
  }

  has(path) {
    return exists(this.state, path, delimiter)
  }

  get(path, options) {
    return locate(options?.silent ? this.data : this.state, path, delimiter)
  }

  set(path, val, options) {
    allocate(options?.silent ? this.data : this.state, path, val, delimiter)
  }

  delete(path, options) {
    deallocate(options?.silent ? this.data : this.state, path, delimiter)
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

  watch(loc, fn) {
    register(this.stage, loc, fn)
  }

  destroy() {
    this.emit("destroy", this)
    this.off("*")
    this.queue.paths.clear()
    this.queue.objects.clear()
    this.pendingUpdate = false
    delete this.data
    delete this.state
    this.stage.cancel("Reactive instance destroyed")
  }
}
