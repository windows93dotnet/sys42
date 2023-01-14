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
        key: "{{selectionKey}}",
        selection: "{{selection}}",
      },
    },

    props: {
      itemTemplate: { type: "object" },
      selection: [],
      selectionKey: "textContent",
      multiselectable: true,
      content: {
        type: "array",
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
    const index = indexOf.call(this.items, document.activeElement)
    this.items[index === -1 ? 0 : index - this.iconsPerLine]?.focus()
  }

  moveFocusDown() {
    const index = indexOf.call(this.items, document.activeElement)
    this.items[index === -1 ? 0 : index + this.iconsPerLine]?.focus()
  }

  moveFocusLeft() {
    const index = indexOf.call(this.items, document.activeElement)
    this.items[index === -1 ? 0 : index - 1]?.focus()
  }

  moveFocusRight() {
    const index = indexOf.call(this.items, document.activeElement)
    this.items[index === -1 ? 0 : index + 1]?.focus()
  }

  #refreshIconPerLine() {
    if (this.items.length === 0) {
      this.iconsPerLine = 0
      return
    }

    const previousY = this.items[0].getBoundingClientRect().y

    for (let i = 1, l = this.items.length; i < l; i++) {
      const { y } = this.items[i].getBoundingClientRect()
      if (y !== previousY) {
        this.iconsPerLine = i
        break
      }
    }
  }

  setup() {
    this.items = this.children[0].children
    this.iconsPerLine = 0
    const ro = new ResizeObserver(debounce(() => this.#refreshIconPerLine()))
    ro.observe(this)
    this.stage.signal.addEventListener("abort", () => ro.disconnect())
  }

  render({ itemTemplate }) {
    return {
      scope: "content",
      content: {
        role: "row",
        each: {
          role: "gridcell",
          aria: { selected: "{{includes(../../../selection, .)}}" },
          tabIndex: "{{@first ? 0 : -1}}",
          ...(itemTemplate ?? { render: true }),
        },
      },
    }
  }
}

Component.define(Grid)
