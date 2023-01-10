import listen from "../../fabric/event/listen.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
// import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
// import appendCSS from "../../fabric/dom/appendCSS.js"
import configure from "../../core/configure.js"
import setTemp from "../../fabric/dom/setTemp.js"
import Canceller from "../../fabric/classes/Canceller.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import noop from "../../fabric/type/function/noop.js"
import HoverScroll from "./HoverScroll.js"

const DEFAULTS = {
  signal: undefined,
  distance: 0,
  grid: false,
  throttle: true,
  subpixel: false,
  selector: undefined,
  ignore: undefined,
  useTargetOffset: false,
  hoverScroll: false,
}

export default class Dragger {
  #isStarted = false
  constructor(el, options) {
    this.el = ensureElement(el)

    this.config = configure(DEFAULTS, options)

    this.start = this.config.start ?? noop
    this.drag = this.config.drag ?? noop
    this.stop = this.config.stop ?? noop

    this.cancel = new Canceller(options?.signal)
    const { signal } = this.cancel

    if (this.config.hoverScroll) {
      this.hoverScroll = new HoverScroll(this.el, this.config.hoverScroll)
    }

    // if (this.config.selector) {
    //   this.config.selector = ensureScopeSelector(this.config.selector, this.el)
    //   appendCSS(`${this.config.selector} { touch-action: none; }`, { signal })
    // } else setTemp(this.el, { signal, style: { "touch-action": "none" } })

    let distX = 0
    let distY = 0

    const round = this.config.subpixel ? (val) => val : Math.round

    let getX = this.config.useTargetOffset
      ? this.config.subpixel
        ? (x) => x - this.offsetX
        : (x) => round(x - this.offsetX)
      : round

    let getY = this.config.useTargetOffset
      ? this.config.subpixel
        ? (y) => y - this.offsetY
        : (y) => round(y - this.offsetY)
      : round

    const { grid } = this.config

    if (grid) {
      const [gridX, gridY] = Array.isArray(grid) ? grid : [grid, grid]
      const coordX = getX
      const coordY = getY

      getX = (x) => {
        x = coordX(x)
        return x - (x % gridX)
      }

      getY = (y) => {
        y = coordY(y)
        return y - (y % gridY)
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

    let forget
    let restore

    const start = (e, target) => {
      const { x, y } = e

      this.#isStarted = true
      this.isDragging = true
      Dragger.isDragging = true

      this.hoverScroll?.init()

      if (this.config.useTargetOffset) {
        const rect = target.getBoundingClientRect()
        this.offsetX = round(e.x - rect.x)
        this.offsetY = round(e.y - rect.y)
      }

      restore = setTemp(document.documentElement, {
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
      drag.clear?.()

      this.fromX = 0
      this.fromY = 0
      this.offsetX = 0
      this.offsetY = 0
      distX = 0
      distY = 0
      forget?.()
      restore?.()
      this.hoverScroll?.clear()

      if (this.#isStarted) {
        window.getSelection().empty()
        this.#isStarted = false
        this.stop(getX(e.x), getY(e.y), e, target)
        queueTask(() => {
          this.isDragging = false
          Dragger.isDragging = false
        })
      }
    }

    let drag = (e, target) => {
      if (this.#isStarted) {
        const x = getX(e.x)
        const y = getY(e.y)
        this.drag(x, y, e, target)
        if (this.config.hoverScroll) {
          this.hoverScroll.update(e, () => this.drag(x, y, e, target))
        }
      } else if (checkDistance(e) && start(e, target) === false) stop(e, target)
    }

    if (this.config.throttle) drag = paintThrottle(drag)

    listen(this.el, {
      signal,
      selector: this.config.selector,
      touchstart: false,
      pointerdown: (e, target) => {
        if (e.target.hasPointerCapture(e.pointerId)) {
          e.target.releasePointerCapture(e.pointerId) // https://stackoverflow.com/a/70976018
        }

        drag.clear?.()
        this.isDragging = false
        Dragger.isDragging = false

        if (this.config.beforestart?.(e, target) === false) return

        target = this.config.selector ? target : this.el
        if (this.config.ignore && e.target.closest(this.config.ignore)) return

        this.fromX = round(e.x)
        this.fromY = round(e.y)

        forget = listen({
          signal,
          "pointermove": (e) => drag(e, target),
          "pointerup || pointercancel || contextmenu": (e) => stop(e, target),
        })
      },
    })
  }

  destroy() {
    this.hoverScroll?.destroy()
    this.cancel()
  }
}
