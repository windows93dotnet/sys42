/* eslint-disable max-params */
import Trait from "../class/Trait.js"
import setup from "../../core/setup.js"
import Dragger from "../class/Dragger.js"
import rect from "../../fabric/geometry/rect.js"
import on from "../../fabric/event/on.js"

// @read https://www.stefanjudis.com/blog/aria-selected-and-when-to-use-it/

const DEFAULTS = {
  items: ":scope > *",
  check: "colliding",
  shortcuts: {
    toggleSelectOne: "click",
    toggleSelect: "Ctrl+click",
    selectAll: "Ctrl+a",
  },
}

const configure = setup("ui.trait.selectable", DEFAULTS)

const ns = "http://www.w3.org/2000/svg"

function emit(item, event) {
  item.dispatchEvent(new CustomEvent(event, { bubbles: true }))
}

class Selectable extends Trait {
  add(item, force) {
    if (force !== true && this.selection.has(item)) {
      this.selection.delete(item)
      emit(item, "selectionremove")
    } else {
      this.selection.add(item)
      emit(item, "selectionadd")
    }
  }

  remove(item) {
    this.selection.delete(item)
    emit(item, "selectionremove")
  }

  toggleSelectOne(e, target) {
    if (this.dragger.isDragging) return
    this.selection.clear()
    const items = this.el.querySelectorAll(this.config.items)
    for (const item of items) {
      this[item.contains(target) ? "add" : "remove"](item)
    }
  }

  toggleSelect(e, target) {
    if (this.dragger.isDragging) return
    const items = this.el.querySelectorAll(this.config.items)
    for (const item of items) if (item.contains(target)) this.add(item)
  }

  selectAll() {
    if (this.dragger.isDragging) return
    const items = this.el.querySelectorAll(this.config.items)
    for (const item of items) this.add(item, true)
  }

  constructor(el, options) {
    super(el)

    this.config = configure(options)
    this.selection = new Set()

    this.el.tabIndex = this.el.tabIndex < 0 ? 0 : this.el.tabIndex

    const sc = this.config.shortcuts

    on(this.el, {
      preventDefault: true,
      [sc.toggleSelectOne]: (e, target) => this.toggleSelectOne(e, target),
      [sc.toggleSelect]: (e, target) => this.toggleSelect(e, target),
      [sc.selectAll]: (e, target) => this.selectAll(e, target),
    })

    this.dragger = new Dragger(this.el, {
      ...this.config,
      start: () => {
        items = this.el.querySelectorAll(this.config.items)
        document.body.append(this.svg)
      },
      drag: (x, y, fromX, fromY, { ctrlKey }) => {
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
          if (check(A, B)) this.add(item, true)
          else if (ctrlKey === false) this.remove(item)
        }
      },
      stop: () => {
        this.polygon.setAttribute("points", points)
        this.svg.remove()
      },
    })

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
