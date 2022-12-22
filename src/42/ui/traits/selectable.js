/* eslint-disable max-params */
import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import Dragger from "../classes/Dragger.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import rect from "../../fabric/geometry/rect.js"
import on from "../../fabric/event/on.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"
import setTemp from "../../fabric/dom/setTemp.js"
import noop from "../../fabric/type/function/noop.js"

const DEFAULTS = {
  selector: ":scope > *",
  check: "colliding",
  class: "selected",
  dragger: { distance: 5 },
  multiselectable: true,
  draggerIgnoreItems: false,
  shortcuts: {
    selectOne: "click || Space",
    toggleSelect: "Ctrl+click || Ctrl+Space",
    rangeSelect: "Shift+click || Shift+Space",
    selectAll: "Ctrl+a",
  },
}

const configure = settings("ui.trait.selectable", DEFAULTS)

const ns = "http://www.w3.org/2000/svg"

class Selectable extends Trait {
  #toggle(el) {
    const val = this.key(el)
    if (this.selection.includes(val)) {
      removeItem(this.selection, val)
      this.remove(el, val)
    } else {
      this.selection.push(val)
      this.add(el, val)
    }
  }

  #add(el) {
    const val = this.key(el)
    if (!this.selection.includes(val)) {
      this.selection.push(val)
      this.add(el, val)
    }
  }

  #remove(el) {
    const val = this.key(el)
    if (this.selection.includes(val)) {
      removeItem(this.selection, val)
      this.remove(el, val)
    }
  }

  ensureSelected(target) {
    target = target.closest(this.config.selector)
    if (!target) return

    const val = this.key(target)
    if (this.selection.length === 0) {
      this.selection.push(val)
      this.add(target, val)
    } else if (!this.selection.includes(val)) {
      for (const el of this.el.querySelectorAll(this.config.selector)) {
        removeItem(this.selection, val)
        this.remove(el, val)
      }

      this.selection.push(val)
      this.add(target, val)
    }
  }

  toggleSelect(target) {
    if (this.dragger.isDragging) return
    const el = target.closest(this.config.selector)
    if (el) this.#toggle(el)
  }

  rangeSelect(target) {
    if (this.dragger.isDragging) return
    if (this.selection.length === 0) this.selectOne(target)
    else {
      let lastFound
      const range = []
      for (const el of this.el.querySelectorAll(this.config.selector)) {
        const val = this.key(target)

        if (el.contains(target)) {
          range.push(el)
          break
        }

        if (this.selection.includes(val)) {
          lastFound = true
          range.length = 0
          continue
        }

        if (lastFound) range.push(el)
      }

      for (const item of range) {
        this.#add(item)
      }

      console.log(range)
    }
  }

  selectOne(target) {
    if (this.dragger.isDragging) return
    for (const el of this.el.querySelectorAll(this.config.selector)) {
      if (el.contains(target)) this.#add(el)
      else this.#remove(el)
    }
  }

  selectAll() {
    if (this.dragger.isDragging) return
    for (const el of this.el.querySelectorAll(this.config.selector)) {
      this.#add(el)
    }
  }

  constructor(el, options) {
    super(el, options)

    if (options?.selection) {
      this.selection = options?.selection
      delete options.selection
    } else this.selection = []

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

    if (this.config.class && !this.config.add && !this.config.remove) {
      this.add = (el) => el.classList.add(this.config.class)
      this.remove = (el) => el.classList.remove(this.config.class)
    } else {
      this.add = this.config.add ?? noop
      this.remove = this.config.remove ?? noop
    }

    this.key = this.config.key ?? ((item) => item)
    if (typeof this.key === "string") {
      this.key = (item) =>
        this.config.key in item
          ? item[this.config.key]
          : item.getAttribute(this.config.key)
    }

    const tmp = {}
    if (this.el.getAttribute("tabindex") === null && this.el.tabIndex === -1) {
      tmp.tabIndex = -1
    }

    const { shortcuts } = this.config
    const { signal } = this.cancel

    setTemp(this.el, {
      signal,
      class: { "selection-0": true },
      ...tmp,
    })

    on(
      this.el,
      { signal },
      {
        [shortcuts.selectOne]: (e, target) => this.selectOne(target),
      },
      this.config.multiselectable && {
        disrupt: true,
        [shortcuts.toggleSelect]: (e, target) => this.toggleSelect(target),
        [shortcuts.rangeSelect]: (e, target) => this.rangeSelect(target),
        [shortcuts.selectAll]: () => this.selectAll(),
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
      beforestart: this.config.dragger.ignore
        ? undefined
        : () => {
            this.dragger.config.ignore ??=
              this.el[Trait.INSTANCES]?.transferable?.selector ??
              this.dragger.config.ignore
          },
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
