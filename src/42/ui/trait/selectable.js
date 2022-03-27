import Trait from "../class/Trait.js"
import setup from "../../system/setup.js"
import Dragger from "../class/Dragger.js"
import rect from "../../fabric/geometry/rect.js"
import shortcuts from "../../system/shortcuts.js"

// @read https://www.stefanjudis.com/blog/aria-selected-and-when-to-use-it/

const DEFAULTS = {
  items: ":scope > *",
  check: "colliding",
}

const configure = setup("ui.trait.selectable", DEFAULTS)

const ns = "http://www.w3.org/2000/svg"

function emit(item, event) {
  item.dispatchEvent(new CustomEvent(event, { bubbles: true }))
}

class Selectable extends Trait {
  constructor(el, options) {
    super("selectable", el)

    this.config = configure(options)

    shortcuts(this.el, { preventDefault: true }, [
      {
        key: "[click]",
        run: (e, target) => {
          if (this.dragger.isDragging) return
          const items = this.el.querySelectorAll(this.config.items)
          for (const item of items) {
            if (item.contains(target)) {
              emit(item, "selectionadd")
            } else {
              emit(item, "selectionremove")
            }
          }
        },
      },
      {
        key: "Ctrl+[click]",
        run: (e, target) => {
          if (this.dragger.isDragging) return
          const items = this.el.querySelectorAll(this.config.items)
          for (const item of items) {
            if (item.contains(target)) emit(item, "selectionadd")
          }
        },
      },
      {
        key: "Ctrl+a",
        run: () => {
          if (this.dragger.isDragging) return
          const items = this.el.querySelectorAll(this.config.items)
          for (const item of items) {
            emit(item, "selectionadd")
          }
        },
      },
    ])

    this.dragger = new Dragger(this.el, this.config)

    const points = "0,0 0,0 0,0 0,0"
    this.svg = document.createElementNS(ns, "svg")
    this.svg.setAttribute("class", "rubberband")
    this.svg.setAttribute("fill", "rgba(80,80,80,0.5)")
    this.polygon = document.createElementNS(ns, "polygon")
    this.polygon.setAttribute("points", points)
    this.svg.style.cssText = `
      pointer-events: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;`

    this.svg.append(this.polygon)

    const check = rect[this.config.check]

    let items

    this.dragger
      .on("start", () => {
        items = this.el.querySelectorAll(this.config.items)
        document.body.append(this.svg)
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
          emit(item, check(A, B) ? "selectionadd" : "selectionremove")
        }
      })
      .on("stop", () => {
        console.log(888)
        this.polygon.setAttribute("points", points)
        this.svg.remove()
      })
  }

  destroy() {
    super.destroy()
    this.svg.remove()
    this.dragger.destroy()
    this.svg = undefined
    this.dragger = undefined
  }
}

export default function selectable(...args) {
  return new Selectable(...args)
}
