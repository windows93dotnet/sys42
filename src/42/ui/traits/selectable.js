import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"
import Dragger from "../classes/Dragger.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import ensureScopeSelector from "../../fabric/dom/ensureScopeSelector.js"
import rect from "../../fabric/geometry/rect.js"
import on from "../../fabric/event/on.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import repaintThrottle from "../../fabric/type/function/repaintThrottle.js"
import setTemp from "../../fabric/dom/setTemp.js"
import noop from "../../fabric/type/function/noop.js"
import getRects from "../../fabric/dom/getRects.js"
import setAttributes from "../../fabric/dom/setAttributes.js"
import removeAttributes from "../../fabric/dom/removeAttributes.js"

const DEFAULTS = {
  selector: ":scope > *",
  check: "colliding",
  attributes: { class: "selected" },
  dragger: { distance: 5, hoverScroll: true },
  zone: undefined,
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

    this.config.add ??= noop
    this.config.remove ??= noop

    this._add = this.config.attributes
      ? (el, val) => {
          setAttributes(el, this.config.attributes, { replaceClass: false })
          this.config.add(el, val)
        }
      : this.config.add

    this._remove = this.config.attributes
      ? (el, val) => {
          removeAttributes(el, this.config.attributes, { flipBoolean: true })
          this.config.remove(el, val)
        }
      : this.config.remove

    if (typeof this.config.key === "string") {
      this.key = (item) =>
        this.config.key in item
          ? item[this.config.key]
          : item.getAttribute(this.config.key)
    } else {
      this.key = this.config.key ?? ((item) => item.textContent)
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
      style: { position: "relative" },
      ...tmp,
    })

    on(
      this.config.zone,
      { signal },
      {
        Space: false,
        [shortcuts.selectOne]: (e, target) => this.selectOne(target, e),
      },
      this.config.multiselectable && {
        prevent: true,
        [shortcuts.toggleSelect]: (e, target) => this.toggleSelect(target),
        [shortcuts.rangeSelect]: (e, target) => this.rangeSelect(target),
        [shortcuts.selectAll]: () => this.selectAll(),
      },
    )

    if (this.config.multiselectable) this.initRubberband()
    else this.dragger = { isDragging: false }
  }

  toggle(el) {
    const val = this.key(el)
    if (this.elements.includes(el)) {
      removeItem(this.selection, val)
      removeItem(this.elements, el)
      this._remove(el, val)
    } else {
      this.selection.push(val)
      this.elements.push(el)
      this._add(el, val)
    }
  }

  add(el) {
    if (!this.elements.includes(el)) {
      const val = this.key(el)
      this.selection.push(val)
      this.elements.push(el)
      this._add(el, val)
    }
  }

  remove(el) {
    if (this.elements.includes(el)) {
      const val = this.key(el)
      removeItem(this.selection, val)
      removeItem(this.elements, el)
      this._remove(el, val)
    }
  }

  toggleSelect(el) {
    if (Dragger.isDragging) return
    el = el.closest(this.config.selector)
    if (el) this.toggle(el)
  }

  selectOne(el) {
    if (Dragger.isDragging) return

    el = el.closest(this.config.selector)

    const remove = []
    for (const item of this.elements) {
      if (item !== el) remove.push(item)
    }

    for (const item of remove) this.remove(item)

    if (el) this.add(el)
  }

  selectAll() {
    if (Dragger.isDragging) return
    for (const el of this.el.querySelectorAll(this.config.selector)) {
      this.add(el)
    }
  }

  ensureSelected(el) {
    el = el.closest(this.config.selector)
    if (!el) return

    if (this.elements.includes(el)) return

    this.clear()
    this.add(el)
  }

  rangeSelect(el) {
    if (Dragger.isDragging) return
    el = el.closest(this.config.selector)
    const all = [...this.el.querySelectorAll(this.config.selector)]
    const a = all.indexOf(el)
    const b = all.indexOf(this.elements.at(-1))
    const min = Math.min(a, b)
    const max = Math.max(a, b)
    for (const item of all.slice(min, max)) this.add(item)
    this.add(el)
  }

  clear() {
    while (this.elements.length > 0) {
      const el = this.elements.shift()
      const val = this.selection.shift()
      this._remove(el, val)
    }
  }

  clearElements() {
    while (this.elements.length > 0) {
      const el = this.elements.shift()
      this._remove(el)
    }
  }

  clearSelection() {
    while (this.selection.length > 0) {
      const val = this.selection.shift()
      this._remove(undefined, val)
    }
  }

  setSelection(arr) {
    this.clear()
    this.selection.push(...arr)
    this.sync()
  }

  setElements(arr) {
    this.clear()
    this.elements.push(...arr)
    this.sync()
  }

  sync() {
    if (this.selection.length > this.elements.length) {
      this.clearElements()
      if (typeof this.config.key === "string") {
        const { key } = this.config
        let fail
        for (const val of this.selection) {
          const el = this.el.querySelector(
            `${this.config.selector}[${key}="${val}"]`,
          )
          if (el) this.elements.push(el)
          else {
            fail = true
            break
          }
        }

        if (fail !== true) {
          for (let i = 0, l = this.elements.length; i < l; i++) {
            this._add(this.elements[i], this.selection[i])
          }

          return
        }

        this.elements.length = 0
      }

      const selection = []
      const elements = []

      for (const el of this.el.querySelectorAll(this.config.selector)) {
        const val = this.key(el)
        const i = this.selection.indexOf(val)
        if (i > -1) {
          selection[i] = val
          elements[i] = el
          this._add(el, val)
        }
      }

      this.selection.length = 0
      this.selection.push(...selection.filter((x) => x !== undefined))
      this.elements.push(...elements.filter((x) => x !== undefined))
    } else if (this.selection.length < this.elements.length) {
      this.clearSelection()
      for (const el of this.elements) {
        const val = this.key(el)
        this.selection.push(val)
        this._add(el, val)
      }
    }
  }

  initRubberband() {
    this.config.dragger.signal = this.cancel.signal

    let rectsPromise
    let rects
    let zoneRect
    const check = rect[this.config.check]

    let fromX
    let fromY

    const handleBoxSelection = repaintThrottle(async (B, ctrlKey) => {
      rects ??= await rectsPromise
      rectsPromise = undefined
      if (!rects) return
      for (const A of rects) {
        if (check(A, B)) this.add(A.target)
        else if (ctrlKey === false) this.remove(A.target)
      }
    })

    this.dragger = new Dragger(this.el, {
      ...this.config.dragger,

      beforestart: this.config.dragger.ignore
        ? undefined
        : () => {
            this.dragger.config.ignore ??=
              this.el[Trait.INSTANCES]?.transferable?.config.selector
          },

      start: () => {
        zoneRect = this.el.getBoundingClientRect()
        const { borderLeftWidth, borderTopWidth } = getComputedStyle(this.el)
        zoneRect.x += Number.parseInt(borderLeftWidth, 10)
        zoneRect.y += Number.parseInt(borderTopWidth, 10)

        fromX = this.dragger.fromX - zoneRect.x + this.el.scrollLeft
        fromY = this.dragger.fromY - zoneRect.y + this.el.scrollTop

        rectsPromise = getRects(this.config.selector, {
          root: this.el,
          relative: true,
        })

        this.svg.style.height = this.el.scrollHeight + "px"
        this.svg.style.width = this.el.scrollWidth + "px"
        this.el.append(this.svg)
      },

      drag: (x, y, { ctrlKey }) => {
        x -= zoneRect.x - this.el.scrollLeft
        y -= zoneRect.y - this.el.scrollTop
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
        rects = undefined
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
      position: absolute;
      inset: 0;
      z-index: 1e5;`

    this.svg.append(this.polygon)
  }

  destroy() {
    super.destroy()
    this.svg?.remove()
    this.dragger?.destroy?.()
    this.svg = undefined
    this.dragger = undefined
  }
}

export function selectable(...args) {
  return new Selectable(...args)
}

export default selectable
