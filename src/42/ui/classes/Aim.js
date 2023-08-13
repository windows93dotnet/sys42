// @read https://bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown

/* eslint-disable max-params */
import listen from "../../fabric/event/listen.js"
import throttle from "../../fabric/type/function/throttle.js"

const ns = "http://www.w3.org/2000/svg"

export class Aim {
  constructor(options) {
    this.el = document.createElementNS(ns, "svg")
    this.el.id = "aim"
    this.el.setAttribute("aria-hidden", "true")
    this.el.style = `
      pointer-events: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;`

    this.polygon = document.createElementNS(ns, "polygon")
    this.polygon.setAttribute("class", "aim-polygon")
    this.polygon.setAttribute("fill", "transparent")
    this.polygon.setAttribute("points", "0,0 0,0 0,0")
    this.polygon.style = "pointer-events: auto;"

    this.polygon.onclick = () => this.reset()

    const dest = options?.dest ?? document.documentElement

    this.el.append(this.polygon)
    dest.append(this.el)

    this.reset()

    this.forget = listen({
      pointermove: throttle((e) => this.setCursor(e), 300),
    })

    options?.signal.addEventListener("abort", () => this.destroy())
  }

  reset() {
    this.polygon.style.display = "none"
    this.cursor = { x: 0, y: 0 }
    this.rect = { top: 0, left: 0, right: 0, bottom: 0 }
    this.resetPoints()
  }

  to(el, cursor, inMenubar) {
    this.polygon.style.display = "block"

    this.inMenubar = inMenubar ?? false
    if (cursor) {
      this.cursor.x = cursor.x
      this.cursor.y = cursor.y
    }

    requestAnimationFrame(() => {
      this.rect = el.getBoundingClientRect()
      this.draw()
    })
  }

  setCursor({ x, y }) {
    this.cursor.x = x
    this.cursor.y = y
    this.draw()
  }

  draw() {
    const { cursor, rect } = this
    const { x, y } = cursor

    if (this.inMenubar) {
      if (y > rect.bottom) {
        this.setPoints(
          x,
          y + 1,
          rect.left - 5,
          rect.bottom,
          rect.right + 5,
          rect.bottom,
        ) // v
      } else if (y < rect.top) {
        this.setPoints(
          x,
          y - 1,
          rect.left - 5,
          rect.top,
          rect.right + 5,
          rect.top,
        ) // ^
      } else this.resetPoints()
    } else if (x < rect.left) {
      this.setPoints(
        x + 1,
        y,
        rect.left,
        rect.top - 5,
        rect.left,
        rect.bottom + 5,
      ) // <
    } else if (x > rect.right) {
      this.setPoints(
        x - 1,
        y,
        rect.right,
        rect.top - 5,
        rect.right,
        rect.bottom + 5,
      ) // >
    } else this.resetPoints()
  }

  resetPoints() {
    this.polygon.setAttribute("points", "0,0 0,0 0,0")
  }

  setPoints(ax, ay, bx, by, cx, cy) {
    const points = `${ax},${ay} ${bx},${by} ${cx},${cy}`
    this.polygon.setAttribute("points", points)
  }

  destroy() {
    this.el.remove()
    this.forget()
    this.reset()
  }
}

export default Aim
