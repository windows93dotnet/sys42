import observe from "../../fabric/locator/observe.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import locate from "../../fabric/locator/locate.js"
import Emitter from "../../fabric/class/Emitter.js"

export default class State extends Emitter {
  constructor(ctx) {
    super()
    this.renderers = ctx.global.renderers
    this.rack = ctx.global.rack
    this.ctx = ctx

    this.queue = new Set()

    this._update = paintThrottle(() => {
      this.emit("update", this.queue)

      const keys = Object.keys(this.renderers).sort((a, b) =>
        a.length > b.length ? -1 : 0
      )

      // console.group("---")
      // console.log(this.queue)
      // console.log(keys)
      // console.groupEnd("---")

      for (const path of this.queue) {
        for (const key of keys) {
          if (key.startsWith(path)) {
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
      (path) => this.update(path)
    )
  }

  update(path) {
    // if an array is changed using length
    // add to the queue any registered renderers on the array
    if (path.endsWith(".length")) this.queue.add(path.slice(0, -7))
    else this.queue.add(path)

    this._update()
  }

  updateAll() {
    const keys = Object.keys(this.renderers)
    // const keys = Object.keys(this.renderers).sort((a, b) =>
    //   a.length > b.length ? -1 : 0
    // )

    this.emit("update", new Set(keys))
    for (const key of keys) {
      for (const render of this.renderers[key]) render()
    }
  }

  get value() {
    return this.rack.value
  }
  set value(value) {
    this.rack.clear()
    Object.assign(this.rack.value, value)
    this.updateAll()
  }

  set(path, value) {
    this.rack.set(path, value)
    if (path === "") this.updateAll()
    else this.update(path)
  }

  get(path) {
    return this.rack.get(path)
  }

  getThisArg(path) {
    const proxy = locate(this.proxy, path)
    return proxy
  }
}
