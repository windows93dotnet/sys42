import Component from "../classes/Component.js"
import debounce from "../../fabric/type/function/debounce.js"
import configure from "../../core/configure.js"
import { objectifyPlan } from "../normalize.js"

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
        selector: ':scope > [role="row"] > [role="gridcell"]',
        attributes: {
          class: undefined,
          aria: { selected: true },
        },
        draggerIgnoreItems: true,
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
    if (!this._items || this._items.length === 0) {
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
        each: configure(
          { tabIndex: "{{@first ? 0 : -1}}" },
          itemTemplate
            ? objectifyPlan(itemTemplate)
            : { content: "{{render(.)}}" },
          { role: "gridcell" }
        ),
      },
    ]
  }
}

Component.define(Grid)
