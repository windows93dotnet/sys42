import "./icon.js"
import Component from "../class/Component.js"
import dispatch from "../../fabric/event/dispatch.js"
import disk from "../../core/disk.js"
import prompt from "../invocables/prompt.js"
import dataTransfertImport from "../../fabric/type/file/dataTransfertImport.js"
import dataTransfertExport from "../../fabric/type/file/dataTransfertExport.js"

const { indexOf } = Array.prototype

export class Folder extends Component {
  static definition = {
    tag: "ui-folder",
    role: "grid",

    aria: {
      multiselectable: true,
    },

    traits: {
      selectable: {
        items: ":scope ui-icon",
        dragger: { ignore: "ui-icon" },
        init() {
          return this.selection
        },
        key({ path }) {
          return path
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
      {
        prevent: true,
        dragover: false,
        async drop(e) {
          const { items, paths } = await dataTransfertImport(e.dataTransfer)
          if (paths) console.log(paths)
          else console.table(items)
        },
      },
      {
        selector: "ui-icon",
        pointerdown(e, target) {
          if (e.button === 2) this.el.autoSelect(target)
        },
        dragstart(e, target) {
          this.el.autoSelect(target)
          dataTransfertExport(e.dataTransfer, { paths: this.el.selection })
        },
        // drag(e) {
        //   console.log(e.x, e.y)
        // },
        // dragend(e) {
        //   console.log("dragend", e)
        // },
      },
    ],

    contextmenu: [
      { label: "coucou", click: "{{hello(e)}}" }, //
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
          draggable: true,
          aria: { selected: "{{includes(../../selection, .)}}" },
          autofocus: "{{@first}}",
          tabIndex: "{{@first ? 0 : -1}}",
          path: "{{.}}",
          contextmenu: [
            { label: "Copy" }, //
            "---",
            { label: "Rename", click: "{{rename(.)}}" },
          ],
        },
      },
    },
  }

  async rename(icon) {
    const name = await prompt("Rename", { value: icon?.path })
    console.log("rename", name)
  }

  autoSelect(target) {
    if (this.selection.length === 0) {
      this.selection.push(target.path)
    } else if (!this.selection.includes(target.path)) {
      this.selection.length = 0
      this.selection.push(target.path)
    }
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
