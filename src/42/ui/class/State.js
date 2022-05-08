import observe from "../../fabric/locator/observe.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import allocate from "../../fabric/locator/allocate.js"
import deallocate from "../../fabric/locator/deallocate.js"
import exists from "../../fabric/locator/exists.js"
import locate from "../../fabric/locator/locate.js"
import Emitter from "../../fabric/class/Emitter.js"

export default class State extends Emitter {
  #update
  #updateFn

  constructor(ctx) {
    super()
    this.renderers = ctx.global.renderers
    this.rack = ctx.global.rack
    this.ctx = ctx

    this.queue = {
      paths: new Set(),
      lengths: new Set(),
      objects: new Set(),
    }

    this.#updateFn = () => {
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

    this.#update = this.#updateFn

    this.proxy = observe(
      this.rack.value, //
      {
        signal: ctx.cancel.signal,
        recursive: true,
        commons: {
          $ui: this.ui,
          $run: this.ctx.global.actions,
        },
      },
      (path, val, oldVal) => this.update(path, val, oldVal)
    )
  }

  get throttle() {
    return this.#update !== this.#updateFn
  }
  set throttle(value) {
    this.#update = value ? paintThrottle(this.#updateFn) : this.#updateFn
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

    this.#update()
  }

  get value() {
    return this.rack.value
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
    return this.rack.get(path)
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
