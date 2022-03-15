import Trait from "../class/Trait.js"
import setup from "../../system/setup.js"
import Dragger from "../class/Dragger.js"
import rect from "../../fabric/geometry/rect.js"

// @read https://www.stefanjudis.com/blog/aria-selected-and-when-to-use-it/

const DEFAULTS = {
  items: ":scope > *",
  check: "colliding",
}

const configure = setup("ui.trait.selectable", DEFAULTS)

const ns = "http://www.w3.org/2000/svg"

class Selectable extends Trait {
  constructor(el, options) {
    super("selectable", el)

    this.config = configure(options)

    this.dragger = new Dragger(this.el, this.config)

    const points = "0,0 0,0 0,0 0,0"
    const svg = document.createElementNS(ns, "svg")
    svg.setAttribute("class", "rubberband")
    svg.setAttribute("fill", "rgba(80,80,80,0.5)")
    this.polygon = document.createElementNS(ns, "polygon")
    this.polygon.setAttribute("points", points)
    svg.style.cssText = `
      pointer-events: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;`

    svg.append(this.polygon)

    const check = rect[this.config.check]

    let items

    this.dragger
      .on("start", () => {
        items = this.el.querySelectorAll(this.config.items)
        document.body.append(svg)
      })
      .on("drag", (x, y, fromX, fromY) => {
        const points = `${fromX},${fromY} ${x},${fromY} ${x},${y} ${fromX},${y}`
        this.polygon.setAttribute("points", points)

        const B = {}

        if (x < fromX) {
          B.left = x
          B.right = fromX
        } else {
          B.left = fromX
          B.right = x
        }

        if (y < fromY) {
          B.top = y
          B.bottom = fromY
        } else {
          B.top = fromY
          B.bottom = y
        }

        for (const item of items) {
          const A = item.getBoundingClientRect()
          item.dispatchEvent(
            new CustomEvent(
              check(A, B) ? "rubberbandadd" : "rubberbandremove",
              { bubbles: true }
            )
          )
        }
      })
      .on("stop", () => {
        this.polygon.setAttribute("points", points)
        svg.remove()
      })
  }

  destroy() {
    super.destroy()
    this.dragger.destroy()
  }
}

export default function selectable(...args) {
  return new Selectable(...args)
}
