import Trait from "../class/Trait.js"
import setup from "../../system/setup.js"
import emittable from "../../fabric/trait/emittable.js"
import throttle from "../../fabric/type/function/throttle.js"
import noop from "../../fabric/type/function/noop.js"
import listen, { delegate } from "../../fabric/dom/listen.js"
import maxZindex from "../../fabric/dom/maxZIndex.js"
import styles from "../../styles.js"

const DEFAULTS = {
  handle: undefined,
  distance: 0,
  throttle: 1000 / 60,
  grid: false,
  position: "fixed",
  type: "transform",
  ignore: "input,textarea,[contenteditable],[contenteditable] *",
  subpixel: false,
  // TODO: // ghost: false,
}

const configure = setup("ui.trait.movable", DEFAULTS)

const { round } = Math

class Movable extends Trait {
  constructor(el, selector, options) {
    if (typeof selector !== "string") {
      options = selector
      selector = undefined
    }

    super("movable", el)

    this.config = configure(options)
    this.selector = selector

    emittable(this)
    this.init()
  }

  init() {
    let distX = 0
    let distY = 0
    this.checkDistance =
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

    const checkIgnore = this.config.ignore
      ? (target) => target.matches(this.config.ignore)
      : noop

    const preventDefault = (e) => {
      if (checkIgnore(e.target) === true) return
      e.preventDefault()
    }

    let x = 0
    let y = 0
    let offsetX = 0
    let offsetY = 0

    this.isDragging = false

    this.restoreTargetsStyles = new WeakMap()

    this.handle = this.config.handle
      ? typeof this.config.handle === "string"
        ? this.el.querySelector(this.config.handle)
        : this.config.handle
      : this.el

    this.start = (e) => {
      this.isDragging = true

      // TODO: use setTemp
      this.target.classList.add("events-0")
      document.body.classList.add("events-iframes-0")
      document.body.classList.add("selection-0")
      document.body.classList.add("transition-0")

      const rect = this.target.getBoundingClientRect()
      x = rect.left
      y = rect.top

      if ("positionable" in this.target[Trait.INSTANCES]) {
        this.target[Trait.INSTANCES].positionable.destroy()
      }

      offsetX = e.x - x
      offsetY = e.y - y

      if (this.restoreTargetsStyles.has(this.target)) {
        this.target.style.zIndex = maxZindex() + 1
      } else {
        this.restoreTargetsStyles.set(
          this.target,
          styles.temp(this.target, {
            "position": this.config.position,
            "z-index": maxZindex() + 1,
            "margin": 0,
            "top": 0,
            "left": 0,
            "min-width": "initial",
            "min-height": "initial",
            "max-width": "initial",
            "max-height": "initial",
            "width": rect.width + "px",
            "height": rect.height + "px",
            "transform": "",
          })
        )
      }

      this.emit("start", this, e)
    }

    this.round = this.config.subpixel ? (v) => v : round

    const place =
      this.config.type === "transform"
        ? (x, y) => {
            this.target.style.transform = `translate(${x}px, ${y}px)`
          }
        : (x, y) => {
            this.target.style.top = y
            this.target.style.left = x
          }

    const coords = this.config.grid
      ? (x, y) => {
          const [X, Y] = this.config.grid
          x -= x % X
          y -= y % Y
          place(x, y)
        }
      : place

    const drag = (e) => {
      if (this.isDragging || this.checkDistance(e)) {
        if (!this.isDragging) this.start(e)
        x = this.round(e.x - offsetX)
        y = this.round(e.y - offsetY)
        coords(x, y)
        this.emit("drag", this, e)
      }
    }

    const throttled =
      typeof this.config.throttle === "number" && this.config.throttle > 0
        ? throttle(drag, this.config.throttle)
        : undefined

    const stop = (e) => {
      throttled?.clear()
      this.forgettings.dragging?.()

      if (this.isDragging) window.getSelection().empty()
      this.isDragging = false
      this.target.classList.remove("events-0")
      document.body.classList.remove("events-iframes-0")
      document.body.classList.remove("selection-0")
      document.body.classList.remove("transition-0")
      this.emit("stop", this, e)
    }

    const init = (e, target) => {
      if (checkIgnore(e.target) === true) return

      distX = 0
      distY = 0

      this.target = this.selector ? target : this.el

      this.forgettings.dragging = listen({
        "pointermove": throttled ?? drag,
        "pointerup pointercancel": stop,
      })
    }

    this.forgettings.push(
      listen(this.handle, {
        "pointerdown": this.selector ? delegate(this.selector, init) : init,
        "touchstart contextmenu": this.selector
          ? delegate(this.selector, preventDefault)
          : preventDefault,
      })
    )
  }

  destroy() {
    const list = [this.el]

    if (this.selector) list.push(...this.el.querySelectorAll(this.selector))

    for (const el of list) {
      const restoreStyles = this.restoreTargetsStyles.get(el)
      if (typeof restoreStyles === "function") restoreStyles()
    }

    super.destroy()
  }
}

export default function movable(...args) {
  return new Movable(...args)
}
