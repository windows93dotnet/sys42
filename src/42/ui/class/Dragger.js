import Emitter from "../../fabric/class/Emitter.js"
import listen from "../../fabric/dom/listen.js"
import configure from "../../fabric/configure.js"
import setTemp from "../../fabric/dom/setTemp.js"

const DEFAULTS = {
  distance: 0,
  throttle: 1000 / 60,
  selector: undefined,
  // ignore: "input,textarea,[contenteditable],[contenteditable] *",
  signal: undefined,
}

export default class Dragger extends Emitter {
  constructor(el, options) {
    super()
    this.el = el
    this.config = configure(DEFAULTS, options)

    let distX = 0
    let distY = 0

    const checkDistance =
      typeof this.config.distance === "number" && this.config.distance > 0
        ? (e) => {
            distX += e.movementX
            distY += e.movementY
            return (
              Math.abs(distX) > this.config.distance ||
              Math.abs(distY) > this.config.distance
            )
          }
        : () => true

    this.controller = new AbortController()
    const { signal } = this.controller
    const listenOptions = { signal }

    let forget
    let restore

    let fromX = 0
    let fromY = 0

    const start = (e) => {
      fromX = e.x
      fromY = e.y
      this.isDragging = true
      restore = setTemp(document.body, {
        class: {
          "events-iframes-0": true,
          "selection-0": true,
          "transition-0": true,
        },
      })
      this.emit("start", e.x, e.y)
    }

    const stop = (e) => {
      fromX = 0
      fromY = 0
      forget?.()
      restore?.()
      if (this.isDragging) {
        window.getSelection().empty()
        requestAnimationFrame(() => {
          this.isDragging = false
          this.emit("stop", e.x, e.y)
        })
      }
    }

    const drag = (e) => {
      if (this.isDragging || checkDistance(e)) {
        if (!this.isDragging) start(e)
        this.emit("drag", e.x, e.y, fromX, fromY)
      }
    }

    listen(this.el, this.selector, listenOptions, {
      pointerdown() {
        distX = 0
        distY = 0
        forget = listen(listenOptions, {
          "pointermove": drag,
          "pointerup pointercancel": stop,
        })
      },
    })
  }

  destroy() {
    this.off("*")
    this.controller.abort()
  }
}
