import listen from "../../fabric/dom/listen.js"
import configure from "../../fabric/configure.js"
import setTemp from "../../fabric/dom/setTemp.js"
import Canceller from "../../fabric/class/Canceller.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import noop from "../../fabric/type/function/noop.js"

const DEFAULTS = {
  distance: 0,
  grid: false,
  throttle: true,
  subpixel: false,
  selector: undefined,
  targetRelative: false,
  signal: undefined,
}

export default class Dragger {
  constructor(el, options) {
    this.el = el
    this.config = configure(DEFAULTS, options)

    this.start = this.config.start ?? noop
    this.drag = this.config.drag ?? noop
    this.stop = this.config.stop ?? noop

    let distX = 0
    let distY = 0

    let fromX = 0
    let fromY = 0

    let offsetX = 0
    let offsetY = 0

    const op = this.config.subpixel ? (val) => val : Math.round

    let getX = this.config.targetRelative
      ? this.config.subpixel
        ? (x) => x - offsetX
        : (x) => op(x - offsetX)
      : op

    let getY = this.config.targetRelative
      ? this.config.subpixel
        ? (y) => y - offsetY
        : (y) => op(y - offsetY)
      : op

    const { grid } = this.config

    if (grid) {
      const opX = getX
      const opY = getY

      getX = (x) => {
        x = opX(x)
        return x - (x % grid[0])
      }

      getY = (y) => {
        y = opY(y)
        return y - (y % grid[1])
      }
    }

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

    this.cancel = new Canceller(options?.signal)
    const { signal } = this.cancel
    const listenOptions = { signal }

    let forget
    let restore

    const start = (e, target) => {
      const { x, y } = e

      fromX = op(x)
      fromY = op(y)

      if (this.config.targetRelative) {
        const rect = this.el.getBoundingClientRect()
        offsetX = op(e.x - rect.left)
        offsetY = op(e.y - rect.top)
      }

      this.isDragging = true
      restore = setTemp(document.body, {
        signal,
        class: {
          "pointer-iframes-0": true,
          "selection-0": true,
          "transition-0": true,
        },
      })
      return this.start(getX(x), getY(y), e, target)
    }

    const stop = (e, target) => {
      distX = 0
      distY = 0
      fromX = 0
      fromY = 0
      offsetX = 0
      offsetY = 0
      forget?.()
      restore?.()
      if (this.isDragging) {
        window.getSelection().empty()
        requestAnimationFrame(() => {
          this.isDragging = false
          this.stop(getX(e.x), getY(e.y), e, target)
        })
      }
    }

    let drag = (e, target) => {
      if (this.isDragging) {
        this.drag(getX(e.x), getY(e.y), fromX, fromY, e, target)
      } else if (checkDistance(e) && start(e, target) === false) stop(e, target)
    }

    if (this.config.throttle) drag = paintThrottle(drag)

    listen(this.el, this.selector, listenOptions, {
      pointerdown(e, target) {
        forget = listen(listenOptions, {
          "pointermove": (e) => drag(e, target),
          "pointerup || pointercancel": (e) => stop(e, target),
        })
      },
    })
  }

  destroy() {
    this.cancel()
  }
}
