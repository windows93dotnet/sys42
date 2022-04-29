/* eslint-disable max-depth */
import observe from "../../fabric/locator/observe.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import allocate from "../../fabric/locator/allocate.js"
import locate from "../../fabric/locator/locate.js"
import flatten from "../../fabric/type/object/flatten.js"
import Emitter from "../../fabric/class/Emitter.js"

export default class State extends Emitter {
  #update

  constructor(ctx) {
    super()
    this.renderers = ctx.global.renderers
    this.rack = ctx.global.rack
    this.ctx = ctx

    this.queue = new Set()

    this.#update = paintThrottle(() => {
      if (this.queue.size === 0) return
      this.emit("update", this.queue)

      const keys = Object.keys(this.renderers)

      // console.group("--- update")
      // console.log(this.queue)
      // console.log(keys)
      // console.groupEnd()

      for (const path of this.queue) {
        if (path.array !== undefined) {
          if (path.array in this.renderers) {
            for (const render of this.renderers[path.array]) {
              render(path.array)
            }
          }

          let i = path.val
          const l = path.oldVal
          for (; i < l; i++) {
            const key = `${path.array}.${i}`
            const rds = this.renderers[key]
            if (rds) for (const render of rds) render(key)
          }

          continue
        }

        for (const key of keys) {
          if (key === path) {
            for (const render of this.renderers[key]) render(key)
          }
        }
      }

      this.queue.clear()
    })

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

  update(path, val, oldVal) {
    if (path.endsWith(".length")) {
      this.queue.add({ array: path.slice(0, -7), val, oldVal })
    } else if (Array.isArray(val)) {
      this.queue.add(path)
      for (const x of flatten.keys(val, ".", path)) this.queue.add(x)
    } else {
      this.queue.add(path)
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

  set(path, value) {
    allocate(this.proxy, path, value)
  }

  get(path) {
    return this.rack.get(path)
  }

  getProxy(path) {
    return locate(this.proxy, path)
  }

  getTarget(path) {
    const proxy = locate(this.proxy, path)
    return proxy["@target"] ?? proxy
  }
}
