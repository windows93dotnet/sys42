/* eslint-disable max-params */
import Trait from "../class/Trait.js"
import setup from "../../core/setup.js"
import Dragger from "../class/Dragger.js"
import rect from "../../fabric/geometry/rect.js"
import noop from "../../fabric/type/function/noop.js"
import on from "../../fabric/event/on.js"

const DEFAULTS = {
  items: ":scope > *",
  check: "colliding",
  shortcuts: {
    toggleSelectOne: "click || Space",
    toggleSelect: "Ctrl+click || Ctrl+Space",
    selectAll: "Ctrl+a",
  },
}

const configure = setup("ui.trait.selectable", DEFAULTS)

const ns = "http://www.w3.org/2000/svg"

class Selectable extends Trait {
  #toggle(item, force) {
    if (force !== true && this.selection.has(item)) {
      this.selection.delete(item)
      this.remove.call(this.el, item)
    } else {
      this.selection.add(item)
      this.add.call(this.el, item)
    }
  }

  #remove(item) {
    this.selection.delete(item)
    this.remove.call(this.el, item)
  }

  toggleSelectOne(e, target) {
    if (this.dragger.isDragging) return
    this.selection.clear()
    const items = this.el.querySelectorAll(this.config.items)
    for (const item of items) {
      item.contains(target) ? this.#toggle(item) : this.#remove(item)
    }
  }

  toggleSelect(e, target) {
    if (this.dragger.isDragging) return
    const items = this.el.querySelectorAll(this.config.items)
    for (const item of items) if (item.contains(target)) this.#toggle(item)
  }

  selectAll() {
    if (this.dragger.isDragging) return
    const items = this.el.querySelectorAll(this.config.items)
    for (const item of items) this.#toggle(item, true)
    return false
  }

  constructor(el, options) {
    super(el)

    this.config = configure(options)

    this.add = this.config.add ?? noop
    this.remove = this.config.remove ?? noop

    this.selection = new Set()

    this.el.tabIndex = this.el.tabIndex < 0 ? 0 : this.el.tabIndex

    const sc = this.config.shortcuts

    on(this.el, {
      // preventDefault: true,
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
          if (check(A, B)) this.#toggle(item, true)
          else if (ctrlKey === false) this.#remove(item)
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
