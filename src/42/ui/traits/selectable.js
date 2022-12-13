/* eslint-disable max-params */
import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import Dragger from "../classes/Dragger.js"
import ensureScopeSelector from "../../fabric/event/ensureScopeSelector.js"
import rect from "../../fabric/geometry/rect.js"
import on from "../../fabric/event/on.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import setTemp from "../../fabric/dom/setTemp.js"
import noop from "../../fabric/type/function/noop.js"

const DEFAULTS = {
  selector: ":scope > *",
  check: "colliding",
  dragger: { distance: 5 },
  multiselectable: true,
  draggerIgnoreItems: false,
  shortcuts: {
    selectOne: "click || Space",
    toggleSelect: "Ctrl+click || Ctrl+Space",
    selectAll: "Ctrl+a",
  },
}

const configure = settings("ui.trait.selectable", DEFAULTS)

const ns = "http://www.w3.org/2000/svg"

class Selectable extends Trait {
  #toggle(item) {
    const val = this.key(item)
    if (this.selection.includes(val)) {
      removeItem(this.selection, val)
      this.remove(item, val)
    } else {
      this.selection.push(val)
      this.add(item, val)
    }
  }

  #add(item) {
    const val = this.key(item)
    if (!this.selection.includes(val)) {
      this.selection.push(val)
      this.add(item, val)
    }
  }

  #remove(item) {
    const val = this.key(item)
    if (this.selection.includes(val)) {
      removeItem(this.selection, val)
      this.remove(item, val)
    }
  }

  toggleSelect(e, target) {
    if (this.dragger.isDragging) return
    const item = target.closest(this.config.selector)
    if (item) this.#toggle(item)
  }

  selectOne(e, target) {
    if (this.dragger.isDragging) return
    const items = this.el.querySelectorAll(this.config.selector)
    for (const item of items) {
      if (item.contains(target)) this.#add(item)
      else this.#remove(item)
    }
  }

  selectAll() {
    if (this.dragger.isDragging) return
    const items = this.el.querySelectorAll(this.config.selector)
    for (const item of items) this.#add(item)
  }

  constructor(el, options) {
    super(el, options)

    this.config = configure(options)

    if (
      options?.selector === undefined &&
      this.el.getAttribute("role") === "grid"
    ) {
      this.config.selector = ':scope > [role="row"] > *'
    }

    this.config.selector = ensureScopeSelector(this.config.selector, this.el)

    if (
      options?.multiselectable === undefined &&
      this.el.getAttribute("aria-multiselectable") === "false"
    ) {
      this.config.multiselectable = false
    }

    if (this.config.draggerIgnoreItems) {
      this.config.dragger.ignore = this.config.selector
    }

    this.init = this.config.init ?? (() => [])
    this.selection = this.config.selection ?? this.init.call(this.el)
    this.add = this.config.add ?? noop
    this.remove = this.config.remove ?? noop
    this.key = this.config.key ?? ((item) => item)
    if (typeof this.key === "string") {
      this.key = (item) => item[this.config.key]
    }

    const tmp = {}
    if (this.el.getAttribute("tabindex") === null && this.el.tabIndex === -1) {
      tmp.tabIndex = -1
    }

    setTemp(this.el, {
      signal: this.cancel.signal,
      class: { "selection-0": true },
      ...tmp,
    })

    const sc = this.config.shortcuts
    on(
      this.el,
      { signal: this.cancel.signal },
      {
        [sc.selectOne]: (e, target) => this.selectOne(e, target),
      },
      this.config.multiselectable && {
        disrupt: true,
        [sc.toggleSelect]: (e, target) => this.toggleSelect(e, target),
        [sc.selectAll]: (e, target) => this.selectAll(e, target),
      }
    )

    if (this.config.multiselectable) this.initRubberband()
    else this.dragger = { isDragging: false }
  }

  initRubberband() {
    this.config.dragger.signal = this.cancel.signal

    let items
    const check = rect[this.config.check]

    const handleBoxSelection = paintThrottle((B, ctrlKey) => {
      for (const item of items) {
        const A = item.getBoundingClientRect()
        if (check(A, B)) this.#add(item)
        else if (ctrlKey === false) this.#remove(item)
      }
    })

    this.dragger = new Dragger(this.el, {
      ...this.config.dragger,
      start: () => {
        items = this.el.querySelectorAll(this.config.selector)
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

        handleBoxSelection(B, ctrlKey)
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
    this.svg.style = `
      pointer-events: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;`

    this.svg.append(this.polygon)
  }

  destroy() {
    super.destroy()
    this.svg.remove()
    this.dragger.destroy()
    this.svg = undefined
    this.dragger = undefined
  }
}

export function selectable(...args) {
  return new Selectable(...args)
}

export default selectable
