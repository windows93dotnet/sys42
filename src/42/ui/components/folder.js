import "./icon.js"
import Component from "../classes/Component.js"
import disk from "../../core/disk.js"
import io from "../../io.js"
import normalizeDirname from "../../core/path/utils/normalizeDirname.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import debounce from "../../fabric/type/function/debounce.js"
// import dt from "../../core/dt.js"

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

          if (!init) {
            this.selection.length = 0
            requestAnimationFrame(() => this.#refreshIconPerLine())
          }

          const path = normalizeDirname(this.path)

          this[_forgetWatch]?.()
          this[_forgetWatch] = disk.watchDir(path, (changed, type) => {
            if (!this.ctx) return

            if (type === "delete") {
              if (this.selection.includes(changed)) {
                removeItem(this.selection, changed)
              }

              changed += "/"

              if (this.selection.includes(changed)) {
                removeItem(this.selection, changed)
              }
            }

            this.ctx.reactive.now(() => {
              this.ctx.reactive.refresh(this.ctx.scope + "/path")
              const el = document.activeElement
              if (el.localName === "ui-icon") {
                // force redraw focusring
                const focusring = el.querySelector(".ui-icon__focusring")
                focusring.style.position = "static"
                delete focusring.style.position
              }
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

    // dropzone: true,
    on: [
      // drag n drop
      // ===========
      // {
      //   async drop(e) {
      //     const { files, folders, paths } = await dt.import(e)
      //     if (paths) io.movePath(paths, this.el.path)
      //     else if (files || folders) {
      //       const fs = await import("../../core/fs.js").then((m) => m.default)
      //       const undones = []

      //       for (const path of folders) {
      //         undones.push(fs.writeDir(this.el.path + path))
      //       }

      //       for (const [path, file] of Object.entries(files)) {
      //         undones.push(fs.write(this.el.path + path, file))
      //       }

      //       await Promise.all(undones)
      //     }
      //   },
      // },
      // {
      //   selector: "ui-icon",
      //   pointerdown(e, target) {
      //     if (e.button === 2) this.el.autoSelect(target.path)
      //   },
      //   dragstart(e, target) {
      //     this.el.autoSelect(target.path)
      //     dt.export(e, { paths: this.el.selection })
      //   },
      //   // drag(e) {
      //   //   console.log(e.x, e.y)
      //   // },
      //   // async dragend(e) {
      //   //   console.log("dragend", e.dataTransfer.dropEffect)
      //   // },
      // },

      // keyboard navigation
      // ===================
      {
        repeatable: true,
        prevent: true,
        ArrowUp: "{{moveFocusUp()}}",
        ArrowDown: "{{moveFocusDown()}}",
        ArrowLeft: "{{moveFocusLeft()}}",
        ArrowRight: "{{moveFocusRight()}}",
      },

      // icon actions
      // ============
      {
        "selector": 'ui-icon[aria-description="file"]',
        "dblclick || Enter || Space": "{{io.launchFile(target.path)}}",
      },
      {
        "selector": 'ui-icon[aria-description="folder"]',
        "dblclick || Enter || Space": "{{io.launchFolder(target.path)}}",
      },
      {
        prevent: true,
        [io.createFolder.meta.shortcut]: "{{io.createFolder(path)}}",
        [io.deleteFile.meta.shortcut]: "{{io.deleteFile(selection)}}",
        [io.renameFile.meta.shortcut]: "{{io.renameFile(selection)}}",
      },
      {
        selector: "ui-icon",
        disrupt: true,
        contextmenu: {
          popup: {
            tag: "ui-menu",
            closeEvents: "pointerdown",
            content: [
              "---",
              {
                ...io.deleteFile.meta,
                click: "{{io.deleteFile(selection)}}",
              },
              "---",
              {
                ...io.renameFile.meta,
                click: "{{io.renameFile(selection)}}",
              },
            ],
          },
        },
      },
    ],

    contextmenu: [
      { ...io.createFolder.meta, click: "{{io.createFolder(path)}}" },
      { ...io.createFile.meta, click: "{{io.createFile(path)}}" },
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
          // draggable: true,
          aria: { selected: "{{includes(../../selection, .)}}" },
          autofocus: "{{@first}}",
          tabIndex: "{{@first ? 0 : -1}}",
          path: "{{.}}",
        },
      },
    },
  }

  autoSelect(path) {
    if (this.selection.length === 0) {
      this.selection.push(path)
    } else if (!this.selection.includes(path)) {
      this.selection.length = 0
      this.selection.push(path)
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

  #refreshIconPerLine() {
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
  }

  #icons

  setup() {
    this.#icons = this.children[0].children
    this.iconsPerLine = 0
    const ro = new ResizeObserver(debounce(() => this.#refreshIconPerLine()))
    ro.observe(this)
    this.ctx.signal.addEventListener("abort", () => ro.disconnect())
  }
}

export default Component.define(Folder)
