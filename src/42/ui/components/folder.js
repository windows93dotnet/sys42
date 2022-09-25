import "./icon.js"
import Component from "../class/Component.js"
import disk from "../../core/disk.js"
import engage from "../../os/engage.js"
import normalizeDirname from "../../core/path/utils/normalizeDirname.js"
import dt from "../../core/dt.js"

const { indexOf } = Array.prototype

const _forgetWatch = Symbol("Folder.forgetWatch")

export class Folder extends Component {
  static definition = {
    tag: "ui-folder",
    role: "grid",

    aria: {
      multiselectable: "{{multiselectable}}",
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
          if (this[_forgetWatch]?.path === this.path) return
          if (!init) this.selection.length = 0

          const path = normalizeDirname(this.path)

          this[_forgetWatch]?.()
          this[_forgetWatch] = disk.watchDir(path, () => {
            this.ctx.reactive.now(() => {
              this.ctx.reactive.refresh(this.ctx.scope + "/path")
            })
          })
          this[_forgetWatch].path = this.path
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
      multiselectable: {
        type: "boolean",
        fromView: true,
        default: true,
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
          const { items, paths } = await dt.import(e.dataTransfer)
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
          dt.export(e.dataTransfer, { paths: this.el.selection })
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
      {
        label: "Create Folder…",
        click: "{{engage.createFolder(path)}}",
      },
      "---",
      { label: "Select all", click: "{{selectable.selectAll()}}" }, //
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
            // {
            //   label: "Create Folder…",
            //   click: "{{engage.createFolder(path)}}",
            // },
            "---",
            { label: "Rename", click: "{{engage.rename(.)}}" },
          ],
        },
      },
    },
  }

  engage = engage

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
      this.err = undefined
    } catch (err) {
      this.err = err.message
      dir = []
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
      if (this.#icons.length === 0) {
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
