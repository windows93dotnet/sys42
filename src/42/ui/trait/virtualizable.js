import Trait from "../class/Trait.js"
import setup from "../../system/setup.js"
import { VirtualScroller } from "./virtualizable/virtual-scroller.js"
import setTemp from "../../fabric/dom/setTemp.js"
import Layout from "./virtualizable/layouts/layout-1d.js"
// import listen from "../../type/dom/listen.js"
// import styles from "../../styles.js"
import emittable from "../../fabric/trait/emittable.js"
// import { getBorders } from "../../type/cssom/getBoundaries.js"
// import debounce from "../../type/function/debounce.js"
// import paintDebounce from "../../type/function/paintDebounce.js"

const DEFAULTS = {
  autoSize: false,
}

// @read https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-posinset
// @read https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-setsize

// @read https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowindex
// @read https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowcount

// TODO: use aria-rowindextext for spreadsheet
// @read https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowindextext

const ROLE_TYPES = {
  list: {
    elements: ["ul", "ol", "menu"],
    roles: [
      "feed",
      // "group",
      "list",
      "listbox",
      "menu",
      "menubar",
      "tablist",
      "tree",
    ],
  },

  table: {
    elements: ["table"],
    roles: [
      "grid", //
      "rowgroup",
      "table",
      "treegrid",
    ],
  },
}

function checkRoles(el) {
  const out = {
    updateContainer: (x) => x,
    updateItem: (x) => x,
  }

  const role = el.getAttribute("role")

  if (
    ROLE_TYPES.list.roles.includes(role) ||
    ROLE_TYPES.list.elements.includes(el.localName)
  ) {
    out.updateItem = (el, size, index) => {
      el.setAttribute("aria-setsize", size)
      el.setAttribute("aria-posinset", index + 1)
    }
  } else if (
    ROLE_TYPES.table.roles.includes(role) ||
    ROLE_TYPES.table.elements.includes(el.localName)
  ) {
    out.updateContainer = (el, size) => el.setAttribute("aria-rowcount", size)
    out.updateItem = (el, size, index) => {
      el.setAttribute("aria-rowindex", index + 1)
    }
  }

  return out
}

const configure = setup("ui.trait.movable", DEFAULTS)

const { DOCUMENT_FRAGMENT_NODE } = Node

const sourceFromArray = (source) => ({
  item: (index) => source[index],
  length: source.length,
})

class Virtualizable extends Trait {
  constructor(el, options) {
    super("virtualizable", el)

    this.config = configure(options)
    let { items, create, update, scrollTarget } = this.config

    scrollTarget ??= this.el

    if (this.el.nodeType === DOCUMENT_FRAGMENT_NODE && this.el.host) {
      scrollTarget = this.el.host
    }

    const { updateContainer, updateItem } = checkRoles(scrollTarget)
    this.updateContainer = updateContainer

    create ??= () => document.createElement("div")
    update ??= (el, item) => {
      el.textContent = item.toString()
    }

    emittable(this)

    this.forgettings.push(setTemp(el, { virtualizable: true }))

    this.pool = []

    this.scroller = new VirtualScroller({
      createElement: (index) =>
        this.pool.length > 0 ? this.pool.pop() : create(index),
      recycleElement: (el) => {
        this.pool.push(el)
      },
      updateElement: (el, index) => {
        updateItem(el, this.scroller.totalItems, index)
        update(el, this._items.item(index), index)
      },
      layout: new Layout(),
      container: this.el,
      scrollTarget,
    })

    // this.forgettings.push(
    //   listen(this.scroller.layout, {
    //     scrollsizechange: () => {
    //       this.el.dispatchEvent(
    //         new CustomEvent("scrollerreflow", { bubbles: true })
    //       )
    //     },
    //   }),
    //   listen(this.el, {
    //     scrollerreflow: paintDebounce(() => {
    //       this.scroller.requestRemeasure()
    //       // this.scroller.requestReset()
    //       this.scroller._scheduleUpdateView()
    //     }),
    //   })
    // )

    this.items = items
  }

  scrollTo(top = 0, left = 0) {
    this.scroller.layout.viewportScroll = { top, left }
    this.scroller.layout.reflowIfNeeded()
  }

  scrollToIndex(index, position) {
    this.scroller.layout.scrollToIndex(index, position)
  }

  get size() {
    return this.scroller.totalItems
  }
  set size(value) {
    this.scroller.totalItems = value
    this.updateContainer(this.el, value)

    // Force scrollbar repaint
    requestAnimationFrame(() => {
      this.el.scrollTop += 1
      this.el.scrollTop -= 1
    })

    // TODO: check if current index if no more visible and scroll to last item
  }

  get items() {
    return this._items
  }
  set items(data) {
    if (data) {
      this._items = Array.isArray(data) ? sourceFromArray(data) : data
      this.size = this._items.length
    } else {
      delete this._items
      this.size = 0
    }
  }

  destroy() {
    super.destroy()
    if (!this.scroller) return
    this.scroller.source = undefined
    this.scroller.layout = undefined
    this.scroller.container = undefined
    this.scroller.scrollTarget = undefined
    this.scroller._childrenRO.disconnect()
    this.scroller._containerRO.disconnect()
    this.scroller = undefined
  }
}

export default function virtualizable(el, options) {
  return new Virtualizable(el, options)
}
