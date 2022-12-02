import "./icon.js"
import Component from "../classes/Component.js"
import disk from "../../core/disk.js"
import io from "../../io.js"
import normalizeDirname from "../../core/path/utils/normalizeDirname.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import contextmenu from "../invocables/contextmenu.js"
import dt from "../../core/dt.js"

const _forgetWatch = Symbol("Folder.forgetWatch")
const _updatePath = Symbol("Folder.updatePath")

export class Folder extends Component {
  static definition = {
    tag: "ui-folder",
    role: "none",

    props: {
      path: {
        type: "string",
        reflect: true,
        default: "/",
        update: _updatePath,
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
      {
        selector: "ui-icon",
        pointerdown(e, target) {
          if (e.button === 2) this.el.autoSelect(target.path)
        },
        dragstart(e, target) {
          this.el.autoSelect(target.path)
          dt.export(e, { paths: this.el.selection })
        },
        //   // drag(e) {
        //   //   console.log(e.x, e.y)
        //   // },
        //   // async dragend(e) {
        //   //   console.log("dragend", e.dataTransfer.dropEffect)
        //   // },
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
        disrupt: true,
        contextmenu: "{{displayContextmenu(e, target)}}",
      },
    ],

    content: {
      tag: "ui-grid",
      entry: "grid",
      selection: "{{selection}}",
      itemTemplate: {
        tag: "ui-icon",
        autofocus: "{{@first}}",
        path: "{{.}}",
      },
      content: "{{getItems(path)}}",
    },
  };

  [_updatePath](initial) {
    if (this[_forgetWatch]?.path === this.path) return

    if (!initial) this.selection.length = 0

    const path = normalizeDirname(this.path)
    const { signal } = this.ctx

    this[_forgetWatch]?.()
    this[_forgetWatch] = disk.watchDir(path, { signal }, (changed, type) => {
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
  }

  displayContextmenu(e, target) {
    const icon = target.closest("ui-icon")
    if (icon) {
      let menu
      let hasFolders = false
      let hasFiles = false
      for (const path of this.selection) {
        if (path.endsWith("/")) hasFolders = true
        else hasFiles = true
      }

      if (hasFolders) {
        menu = hasFiles ? io.fileContextMenu : io.folderContextMenu
      } else menu = io.fileContextMenu

      contextmenu(icon, e, menu, this.ctx)
    } else {
      const menu = [
        { ...io.createFolder.meta, click: "{{io.createFolder(path)}}" },
        { ...io.createFile.meta, click: "{{io.createFile(path)}}" },
        "---",
        { label: "Select all", click: "{{selectAll()}}" }, //
      ]
      contextmenu(this, e, menu, this.ctx)
    }
  }

  selectAll() {
    this.grid.selectable.selectAll()
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
}

export default Component.define(Folder)
