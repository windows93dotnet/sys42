import observe from "../../fabric/locator/observe.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import allocate from "../../fabric/locator/allocate.js"
import deallocate from "../../fabric/locator/deallocate.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import Emitter from "../../fabric/class/Emitter.js"

export default class State extends Emitter {
  #update = {
    throttle: false,
  }

  constructor(ctx, component) {
    super()
    this.renderers = ctx.global.renderers
    this.store = ctx.global.store
    this.ctx = ctx

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
          const key = `${path}.${i}`
          if (key in this.renderers) {
            for (const render of this.renderers[key]) {
              render(key)
            }
          }
        }
      }

      for (const path of this.queue.objects) {
        changes.add(path)
        for (const key of Object.keys(this.renderers)) {
          if (key.startsWith(path) && key in this.renderers) {
            for (const render of this.renderers[key]) {
              render(key)
            }
          }
        }
      }

      for (const path of this.queue.paths) {
        changes.add(path)
        if (path in this.renderers) {
          for (const render of this.renderers[path]) {
            render(path)
          }
        }
      }

      this.emit("update", changes)

      // console.group("--- update")
      // console.log(changes)
      // console.log(Object.keys(this.renderers))
      // console.groupEnd()

      this.queue.paths.clear()
      this.queue.lengths.clear()
      this.queue.objects.clear()
    }

    this.#update.onrepaint = paintThrottle(this.#update.now)
    this.#update.fn = this.#update.now

    this.proxy = observe(
      this.store.value, //
      {
        recursive: true,
        signal: ctx.cancel.signal,
        scopes: ctx.global.scopes,
        component,
      },
      (path, val, oldVal) => this.update(path, val, oldVal)
    )
  }

  get throttle() {
    return this.#update.fn === this.#update.onrepaint
  }
  set throttle(value) {
    this.#update.throttle = value
    this.#update.fn = value ? this.#update.onrepaint : this.#update.now
  }

  update(path, val, oldVal) {
    if (path.endsWith(".length")) {
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

  updateNow(path, val, oldVal) {
    const { throttle } = this
    this.throttle = false
    this.update(path, val, oldVal)
    this.throttle = throttle
  }

  get value() {
    return this.store.value
  }
  set value(value) {
    for (const key in this.proxy) {
      if (Object.hasOwnProperty.call(this.proxy, key)) {
        delete this.proxy[key]
      }
    }

    Object.assign(this.proxy, value)
  }

  assign(path, value) {
    const proxy = locate(this.proxy, path)
    Object.assign(proxy, value)
  }

  has(path) {
    return exists(this.proxy, path)
  }

  set(path, value) {
    allocate(this.proxy, path, value)
  }

  get(path) {
    return this.store.get(path)
  }

  delete(path) {
    deallocate(this.proxy, path)
  }

  getProxy(path) {
    return locate(this.proxy, path)
  }

  getTarget(path) {
    const proxy = locate(this.proxy, path)
    return proxy["@target"] ?? proxy
  }
}
