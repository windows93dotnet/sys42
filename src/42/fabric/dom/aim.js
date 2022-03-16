// @read https://bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown

/* eslint-disable max-params */
import listen from "./listen.js"
import throttle from "../type/function/throttle.js"

const ns = "http://www.w3.org/2000/svg"

class Aim {
  constructor(el) {
    const svg = document.createElementNS(ns, "svg")
    this.polygon = document.createElementNS(ns, "polygon")
    this.polygon.setAttribute("class", "aim-polygon")
    this.polygon.setAttribute("fill", "transparent")
    this.polygon.setAttribute("points", "0,0 0,0 0,0")
    this.polygon.style.cssText = "pointer-events: auto;"
    svg.style.cssText = `
      pointer-events: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;`

    this.polygon.onclick = () => this.reset()

    svg.append(this.polygon)
    el.append(svg)

    this.reset()

    this.forget = listen({
      pointermove: throttle((e) => this.setCursor(e), 100),
    })
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
        this.setPoints(x, y, rect.left, rect.bottom, rect.right, rect.bottom) // v
      } else if (y < rect.top) {
        this.setPoints(x, y, rect.left, rect.top, rect.right, rect.top) // ^
      } else this.resetPoints()
    } else if (x < rect.left) {
      this.setPoints(x, y, rect.left, rect.top, rect.left, rect.bottom) // <
    } else if (x > rect.right) {
      this.setPoints(x, y, rect.right, rect.top, rect.right, rect.bottom) // >
    } else this.resetPoints()
  }

  resetPoints() {
    this.polygon.setAttribute("points", "0,0 0,0 0,0")
  }

  setPoints(ax, ay, bx, by, cx, cy) {
    const points = `${ax},${ay} ${bx},${by} ${cx},${cy}`
    this.polygon.setAttribute("points", points)
  }
}

export default function aim(el) {
  return new Aim(el)
}
