/* eslint-disable max-depth */
import Emitter from "../../fabric/classes/Emitter.js"
import observe from "../../fabric/locator/observe.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import allocate from "../../fabric/locator/allocate.js"
import deallocate from "../../fabric/locator/deallocate.js"
import defer from "../../fabric/type/promise/defer.js"
import dispatch from "../../fabric/event/dispatch.js"
import equals from "../../fabric/type/any/equals.js"
import merge from "../../fabric/type/object/merge.js"
import repaintThrottle from "../../fabric/type/function/repaintThrottle.js"
import serialize from "../../fabric/type/any/serialize.js"
import register from "../register.js"

const delimiter = "/"

export default class Reactive extends Emitter {
  #update = {}

  constructor(stage, data = {}) {
    super({ signal: stage.cancel.signal })
    stage.cancel.signal.addEventListener("abort", () => this.destroy())

    this.stage = stage
    this.data = data
    this.bypassEqualCheck = false

    Object.defineProperty(this.stage, "state", {
      enumerable: true,
      get: () => this.state,
    })

    this.queue = new Set()

    const update = () => {
      try {
        this.emit("prerender", this.queue)
      } catch (err) {
        dispatch(stage.el, err)
      }

      if (this.queue.size === 0) {
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

    this.#update.onrepaint = repaintThrottle(update)
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
        if (key.startsWith("@")) {
          const parts = key.split(":")
          const index = Number(parts[1])
          if (key.startsWith("@index")) return index
          if (key.startsWith("@first")) return index === 0
          if (key.startsWith("@last")) {
            return index === parent[chain.at(-1)].length - 1
          }
        }

        if (key.startsWith("#")) {
          const parts = key.split(":")
          return parts[1].padStart(parts[0].length, "0")
        }

        if (exists(this.data, `$computed${path}`, delimiter)) {
          return locate(this.state, `$computed${path}`, delimiter)
        }
      },
    })
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

  update(path, val, oldVal, deleted) {
    this.pendingUpdate ||= defer()
    this.enqueue(this.queue, path, val, oldVal, deleted)
    this.#update.fn()
  }

  // eslint-disable-next-line max-params
  enqueue(queue, loc, val, oldVal, deleted) {
    if (deleted) {
      queue.add([loc, Boolean(oldVal && typeof oldVal === "object"), true])
    } else if (loc.endsWith("/length")) {
      queue.add([loc.slice(0, -7), true])
    } else if (val && typeof val === "object") {
      if (
        oldVal !== undefined &&
        "$ref" in val === false &&
        !this.bypassEqualCheck &&
        equals(val, oldVal)
      ) {
        return
      }

      queue.add([loc, true])
    } else {
      if (
        oldVal !== undefined &&
        !this.bypassEqualCheck &&
        equals(val, oldVal)
      ) {
        return
      }

      queue.add([loc, false])
    }
  }

  render(queue) {
    const changes = new Set()
    const deleteds = new Set()

    const rendereds = new WeakSet()

    for (const [loc, isObject, deleted] of queue) {
      changes.add(loc)
      if (deleted) deleteds.add(loc)
      if (isObject) {
        for (const key in this.stage.renderers) {
          if (key.startsWith(loc)) {
            for (const render of this.stage.renderers[key]) {
              if (rendereds.has(render)) continue
              render(key)
              rendereds.add(render)
            }
          }
        }
      } else if (loc in this.stage.renderers) {
        for (const render of this.stage.renderers[loc]) {
          if (rendereds.has(render)) continue
          render(loc)
          rendereds.add(render)
        }
      }
    }

    // root renderers
    if (delimiter in this.stage.renderers) {
      for (const render of this.stage.renderers[delimiter]) {
        if (rendereds.has(render)) continue
        render(delimiter)
        rendereds.add(render)
      }
    }

    // console.group("State Update", { inTop: window.top === window.self })
    // const list = Object.keys(this.stage.renderers).join("\n")
    // console.log([...changes].join("\n"))
    // console.log(`%c${list}`, "color:#999")
    // console.groupEnd()

    queue.clear()

    return [changes, deleteds]
  }

  export(changes, deleteds) {
    // if (this.stage.signal.aborted) return

    // TODO: find a way to export only necessary data (e.g. using a keyword list in ui plan)
    const data = { add: [], remove: [] }
    for (const loc of changes) {
      if (deleteds.has(loc)) data.remove.push(loc)
      else {
        const res = locate(this.data, loc, delimiter)
        data.add.push([loc, serialize(res)])
      }
    }

    return data
  }

  import({ add, remove }, ...rest) {
    // if (this.stage.signal.aborted) return

    const queue = new Set()

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
    return register(this.stage, loc, fn)
  }

  destroy() {
    this.emit("destroy", this)
    this.off("*")
    this.queue.clear()
    this.pendingUpdate = false
    delete this.data
    delete this.state
    this.stage.cancel("Reactive instance destroyed")
  }
}
