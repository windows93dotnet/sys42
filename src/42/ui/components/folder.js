import "./icon.js"
import Component from "../class/Component.js"
import dispatch from "../../fabric/event/dispatch.js"
import disk from "../../core/disk.js"
import removeItem from "../../fabric/type/array/removeItem.js"

const { indexOf } = Array.prototype

export class Folder extends Component {
  static definition = {
    tag: "ui-folder",
    role: "grid",

    aria: {
      multiselectable: true,
    },

    tabIndex: -1,

    traits: {
      selectable: {
        items: ":scope ui-icon",
        dragger: { ignore: "ui-icon" },
        add({ path }) {
          if (!this.selection.includes(path)) this.selection.push(path)
        },
        remove({ path }) {
          removeItem(this.selection, path)
        },
      },
    },

    props: {
      path: {
        type: "string",
        reflect: true,
        default: "/",
        update(init) {
          if (!init) this.selection.length = 0
        },
      },
      glob: {
        type: "boolean",
        fromView: true,
      },
      selection: {
        type: "array",
        default: [],
      },
    },

    on: [
      {
        repeatable: true,
        ArrowUp: "{{moveFocusUp()}}",
        ArrowDown: "{{moveFocusDown()}}",
        ArrowLeft: "{{moveFocusLeft()}}",
        ArrowRight: "{{moveFocusRight()}}",
      },
    ],

    computed: {
      items: "{{getItems(path)}}",
    },

    content: {
      role: "row",
      content: {
        scope: "items",
        each: {
          tag: "ui-icon",
          role: "gridcell",
          aria: { selected: "{{includes(../../selection, .)}}" },
          autofocus: "{{@first}}",
          path: "{{.}}",
        },
      },
    },
  }

  getItems(path) {
    let dir
    try {
      dir = this.glob
        ? disk.glob(
            path.endsWith("*") || path.includes(".") ? path : path + "*"
          )
        : disk.readDir(path, { absolute: true })
    } catch (err) {
      dir = []
      dispatch(this, err)
    }

    return dir
  }

  moveFocusUp() {
    const index = indexOf.call(this.#icons, document.activeElement)
    this.#icons[index === -1 ? 0 : index - this.iconsPerLine]?.focus()
  }

  moveFocusDown() {
    const index = indexOf.call(this.#icons, document.activeElement)
    this.#icons[index === -1 ? 0 : index + this.iconsPerLine]?.focus()
  }

  moveFocusLeft() {
    const index = indexOf.call(this.#icons, document.activeElement)
    this.#icons[index === -1 ? 0 : index - 1]?.focus()
  }

  moveFocusRight() {
    const index = indexOf.call(this.#icons, document.activeElement)
    this.#icons[index === -1 ? 0 : index + 1]?.focus()
  }

  #icons

  setup() {
    this.#icons = this.children[0].children
    this.iconsPerLine = 0
    const ro = new ResizeObserver(() => {
      if (this.children.length === 0) {
        this.iconsPerLine = 0
        return
      }

      const previousY = this.#icons[0].getBoundingClientRect().y

      for (let i = 1, l = this.#icons.length; i < l; i++) {
        const { y } = this.#icons[i].getBoundingClientRect()
        if (y !== previousY) {
          this.iconsPerLine = i
          break
        }
      }
    })
    ro.observe(this)
    this.ctx.signal.addEventListener("abort", () => ro.disconnect())
  }
}

export default Component.define(Folder)
