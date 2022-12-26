import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import Dragger from "../classes/Dragger.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
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
  dragger: { distance: 5, autoScroll: true },
  zone: undefined,
  multiselectable: true,
  draggerIgnoreItems: false,
  shortcuts: {
    selectOne: "pointerdown || Space",
    toggleSelect: "Ctrl+pointerdown || Ctrl+Space",
    rangeSelect: "Shift+pointerdown || Shift+Space",
    selectAll: "Ctrl+a",
  },
}

const configure = settings("ui.trait.selectable", DEFAULTS)

const ns = "http://www.w3.org/2000/svg"

class Selectable extends Trait {
  #toggle(el) {
    const val = this.key(el)
    if (this.elements.includes(el)) {
      removeItem(this.selection, val)
      removeItem(this.elements, el)
      this.remove(el, val)
    } else {
      this.selection.push(val)
      this.elements.push(el)
      this.add(el, val)
    }
  }

  #add(el) {
    const val = this.key(el)
    if (!this.elements.includes(el)) {
      this.selection.push(val)
      this.elements.push(el)
      this.add(el, val)
    }
  }

  #remove(el) {
    const val = this.key(el)
    if (this.elements.includes(el)) {
      removeItem(this.selection, val)
      removeItem(this.elements, el)
      this.remove(el, val)
    }
  }

  toggleSelect(target) {
    if (this.dragger.isDragging) return
    const el = target.closest(this.config.selector)
    if (el) this.#toggle(el)
  }

  selectOne(target) {
    if (this.dragger.isDragging) return

    const el = target.closest(this.config.selector)

    const remove = []
    for (const item of this.elements) {
      if (item !== el) remove.push(item)
    }

    for (const item of remove) this.#remove(item)

    if (el) this.#add(el)
  }

  selectAll() {
    if (this.dragger.isDragging) return
    for (const el of this.el.querySelectorAll(this.config.selector)) {
      this.#add(el)
    }
  }

  ensureSelected(target) {
    const el = target.closest(this.config.selector)
    if (!el) return

    if (this.elements.length === 0) {
      this.#add(el)
    } else if (!this.elements.includes(el)) {
      this.selectOne(el)
    }
  }

  rangeSelect(target) {
    if (this.dragger.isDragging) return
    const el = target.closest(this.config.selector)
    const all = [...this.el.querySelectorAll(this.config.selector)]
    const a = all.indexOf(el)
    const b = all.indexOf(this.elements.at(-1))
    const min = Math.min(a, b)
    const max = Math.max(a, b)
    for (const item of all.slice(min, max)) this.#add(item)
    this.#add(el)
  }

  clear() {
    while (this.elements.length > 0) {
      const el = this.elements.shift()
      const val = this.selection.shift()
      this.remove(el, val)
    }
  }

  selectionFrom(arr) {
    this.clear()
    this.selection.push(...arr)
    this.sync()
  }

  elementsFrom(arr) {
    this.clear()
    this.elements.push(...arr)
    this.sync()
  }

  sync() {
    if (this.selection.length > this.elements.length) {
      this.elements.length = 0
      if (typeof this.config.key === "string") {
        const { key } = this.config
        let fail
        for (const val of this.selection) {
          const el = this.el.querySelector(
            `${this.config.selector}[${key}="${val}"]`
          )
          if (el) this.elements.push(el)
          else {
            fail = true
            break
          }
        }

        if (fail !== true) return
        this.elements.length = 0
      }

      for (const el of this.el.querySelectorAll(this.config.selector)) {
        const val = this.key(el)
        const i = this.selection.indexOf(val)
        if (i > -1) this.elements[i] = el
      }
    } else if (this.selection.length < this.elements.length) {
      this.selection.length = 0
      for (const el of this.elements) this.selection.push(this.key(el))
    }
  }

  constructor(el, options) {
    super(el, options)

    if (options?.selection) {
      this.selection = options?.selection
      delete options.selection
    } else this.selection = []

    if (options?.elements) {
      this.elements = options?.elements
      delete options.elements
    } else this.elements = []

    this.config = configure(options)

    this.config.zone = this.config.zone
      ? ensureElement(this.config.zone)
      : this.el

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

    this.sync()

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
      this.config.zone,
      { signal },
      {
        Space: false,
        [shortcuts.selectOne]: (e, target) => this.selectOne(target),
      },
      this.config.multiselectable && {
        // disrupt: true,
        prevent: true,
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
              this.el[Trait.INSTANCES]?.transferable?.config.selector ??
              this.dragger.config.ignore
          },
      start: () => {
        items = this.el.querySelectorAll(this.config.selector)
        document.body.append(this.svg)
      },
      drag: (x, y, { ctrlKey }) => {
        const { fromX, fromY } = this.dragger
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
