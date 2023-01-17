import Component from "../classes/Component.js"
import debounce from "../../fabric/type/function/debounce.js"

const { indexOf } = Array.prototype

export class Grid extends Component {
  static plan = {
    tag: "ui-grid",
    role: "grid",

    aria: {
      multiselectable: "{{multiselectable}}",
    },

    traits: {
      selectable: {
        draggerIgnoreItems: true,
        class: false,
        // ariaSelected: true,
        key: "{{selectionKey}}",
        selection: "{{selection}}",
      },
    },

    props: {
      itemTemplate: { type: "object" },
      selection: [],
      selectionKey: "textContent",
      multiselectable: true,
      items: {
        type: "array",
        // storeInState: false,
        default: [],
        update(initial) {
          if (!initial) requestAnimationFrame(() => this.#refreshIconPerLine())
        },
      },
    },

    on: {
      repeatable: true,
      prevent: true,
      ArrowUp: "{{moveFocusUp()}}",
      ArrowDown: "{{moveFocusDown()}}",
      ArrowLeft: "{{moveFocusLeft()}}",
      ArrowRight: "{{moveFocusRight()}}",
    },
  }

  moveFocusUp() {
    const index = indexOf.call(this._items, document.activeElement)
    this._items[index === -1 ? 0 : index - this.itemsPerLine]?.focus()
  }

  moveFocusDown() {
    const index = indexOf.call(this._items, document.activeElement)
    const next = this._items[index === -1 ? 0 : index + this.itemsPerLine]
    if (next) next.focus()
    else if (index !== this._items.length - 1) {
      this._items[this._items.length - 1].focus()
    }
  }

  moveFocusLeft() {
    const index = indexOf.call(this._items, document.activeElement)
    this._items[index === -1 ? 0 : index - 1]?.focus()
  }

  moveFocusRight() {
    const index = indexOf.call(this._items, document.activeElement)
    this._items[index === -1 ? 0 : index + 1]?.focus()
  }

  #refreshIconPerLine() {
    if (this._items.length === 0) {
      this.itemsPerLine = 0
      return
    }

    const previousY = this._items[0].getBoundingClientRect().y

    for (let i = 1, l = this._items.length; i < l; i++) {
      const { y } = this._items[i].getBoundingClientRect()
      if (y !== previousY) {
        this.itemsPerLine = i
        break
      }
    }
  }

  setup() {
    this._items = this.children[0].children
    this.itemsPerLine = 0
    const ro = new ResizeObserver(debounce(() => this.#refreshIconPerLine()))
    ro.observe(this)
    this.stage.signal.addEventListener("abort", () => ro.disconnect())
  }

  render({ itemTemplate }) {
    return [
      {
        scope: "items",
        role: "row",
        each: {
          role: "gridcell",
          aria: { selected: "{{includes(../../selection, .)}}" },
          tabIndex: "{{@first ? 0 : -1}}",
          ...(itemTemplate ?? { content: "{{render(.)}}" }),
        },
      },
    ]
  }
}

Component.define(Grid)
