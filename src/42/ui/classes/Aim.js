// @read https://bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown
// @read https://www.smashingmagazine.com/2023/08/better-context-menus-safe-triangles/

/* eslint-disable max-params */
import listen from "../../fabric/event/listen.js"
import stopEvent from "../../fabric/event/stopEvent.js"
import repaintThrottle from "../../fabric/type/function/repaintThrottle.js"

const DEFAULTS = {
  refresh: 100,
  threshold: 0,
  direction: "horizontal",
}

const ns = "http://www.w3.org/2000/svg"

export class Aim {
  constructor(options) {
    this.el = document.createElementNS(ns, "svg")
    this.el.id = "menu-aim"
    this.el.setAttribute("aria-hidden", "true")
    this.el.style = `
      pointer-events: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;`

    this.triangle = document.createElementNS(ns, "polygon")
    this.triangle.id = "menu-aim-triangle"
    this.triangle.setAttribute("fill", "transparent")
    this.triangle.setAttribute("points", "0,0 0,0 0,0")
    this.triangle.style = "display:none; pointer-events: auto;"
    this.triangle.onpointerdown = (e) => {
      stopEvent(e)
      this.reset()
      this.setCursor(e)
      this.propagateEvent(e, "pointerdown")
    }

    this.config = { ...DEFAULTS, ...options }
    this.config.dest ??= document.documentElement

    this.el.append(this.triangle)
    this.config.dest.append(this.el)

    this.direction = this.config.direction
    this.t = this.config.threshold
    this.cursor = { x: 0, y: 0 }
    this.rect = { top: 0, left: 0, right: 0, bottom: 0 }

    if (this.config.target) this.setTarget(this.config.target)

    let refreshTimerId

    this.forget = listen({
      selector: (this.config.selector ?? "") + ", #menu-aim-triangle",
      pointermove: repaintThrottle((e) => {
        clearTimeout(refreshTimerId)

        if (!this.#active) return

        if (e.target.id === "menu-aim-triangle") {
          refreshTimerId = setTimeout(() => {
            this.setCursor(e)
            this.propagateEvent(e, "pointermove")
          }, this.config.refresh)
          return
        }

        this.setCursor(e)
      }),
    })

    this.config.signal?.addEventListener("abort", () => this.destroy())
  }

  #active
  get active() {
    return this.#active
  }
  set active(val) {
    this.#active = Boolean(val)
    if (this.#active) {
      this.triangle.style.display = "block"
    } else {
      this.triangle.style.display = "none"
      this.rect.top = 0
      this.rect.bottom = 0
      this.rect.left = 0
      this.rect.right = 0
      this.resetPoints()
    }
  }

  reset() {
    this.active = false
  }

  setTarget(el, direction) {
    this.active = true
    this.target = el

    this.direction = direction ?? this.config.direction

    const rect = this.target.getBoundingClientRect()
    this.rect.top = rect.top
    this.rect.bottom = rect.bottom
    this.rect.left = rect.left
    this.rect.right = rect.right
    if (this.cursor.x === 0 && this.cursor.y === 0) return
    this.draw()
  }

  setCursor({ x, y }) {
    this.cursor.x = x
    this.cursor.y = y
    this.draw()
  }

  draw() {
    const { cursor, rect } = this
    const { x, y } = cursor

    if (this.direction === "vertical") {
      if (y > rect.bottom) {
        this.setPoints(
          x,
          y + 1,
          rect.left - this.t,
          rect.bottom,
          rect.right + this.t,
          rect.bottom,
        ) // v
      } else if (y < rect.top) {
        this.setPoints(
          x,
          y - 1,
          rect.left - this.t,
          rect.top,
          rect.right + this.t,
          rect.top,
        ) // ^
      } else this.resetPoints()
    } else if (x < rect.left) {
      this.setPoints(
        x + 1,
        y,
        rect.left,
        rect.top - this.t,
        rect.left,
        rect.bottom + this.t,
      ) // <
    } else if (x > rect.right) {
      this.setPoints(
        x - 1,
        y,
        rect.right,
        rect.top - this.t,
        rect.right,
        rect.bottom + this.t,
      ) // >
    } else this.resetPoints()
  }

  resetPoints() {
    this.triangle.setAttribute("points", "0,0 0,0 0,0")
  }

  setPoints(ax, ay, bx, by, cx, cy) {
    const points = `${ax},${ay} ${ax},${ay} ${bx},${by} ${cx},${cy}`
    this.triangle.setAttribute("points", points)
  }

  propagateEvent(e, event) {
    if (this.config.propagateEvent === false) return
    this.triangle.style.display = "none"
    const [el] = document.elementsFromPoint(e.x, e.y)
    this.triangle.style.display = this.#active ? "block" : "none"
    if (el) {
      el.dispatchEvent(
        Object.defineProperties(
          new PointerEvent(event, {
            bubbles: true,
            cancelable: true,
          }),
          {
            x: { value: e.x, enumerable: true },
            y: { value: e.y, enumerable: true },
          },
        ),
      )
    }
  }

  destroy() {
    this.el.remove()
    this.forget()
    this.reset()
  }
}

export default Aim
