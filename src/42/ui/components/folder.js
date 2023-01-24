import "./icon.js"
import Component from "../classes/Component.js"
import disk from "../../core/disk.js"
import io from "../../io.js"
import normalizeDirname from "../../core/fs/normalizeDirname.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import contextmenu from "../invocables/contextmenu.js"
// import dt from "../../core/dt.js"

const _forgetWatch = Symbol("Folder.forgetWatch")
const _updatePath = Symbol("Folder.updatePath")

export class Folder extends Component {
  static plan = {
    tag: "ui-folder",
    role: "none",

    props: {
      path: {
        type: "string",
        reflect: true,
        default: "/",
        update: _updatePath,
      },
      view: {
        type: "string",
        fromView: true,
        default: "grid",
      },
      selection: {
        type: "array",
        default: [],
      },
      glob: {
        type: "boolean",
        fromView: true,
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
      // {
      //   selector: "ui-icon",
      //   pointerdown(e, target) {
      //     if (e.button === 2) this.el.ensureSelected(target.path)
      //     // this.el.ensureSelected(target.path)
      //   },
      //   // dragstart(e, target) {
      //   //   this.el.ensureSelected(target.path)
      //   //   dt.export(e, { paths: this.el.selection })
      //   // },
      //   //   // drag(e) {
      //   //   //   console.log(e.x, e.y)
      //   //   // },
      //   //   // async dragend(e) {
      //   //   //   console.log("dragend", e.dataTransfer.dropEffect)
      //   //   // },
      // },

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
  };

  [_updatePath](initial) {
    this.path = normalizeDirname(this.path)

    if (this[_forgetWatch]?.path === this.path) return

    if (!initial) this.selection.length = 0

    const { signal } = this.stage
    const options = { signal }

    this[_forgetWatch]?.()
    this[_forgetWatch] = disk.watchDir(this.path, options, (changed, type) => {
      if (!this.stage) return

      const { selection } = this

      if (type === "delete") {
        if (selection.includes(changed)) removeItem(selection, changed)
        changed += "/"
        if (selection.includes(changed)) removeItem(selection, changed)
      }

      this.refresh()
    })
    this[_forgetWatch].path = this.path
  }

  go(path) {
    this.path = path
  }

  refresh() {
    this.stage.reactive.now(() => {
      this.stage.reactive.refresh(this.stage.scope + "/path")
    })
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

      contextmenu(icon, e, menu, this.stage)
    } else {
      const menu = [
        { ...io.createFolder.meta, click: "{{io.createFolder(path)}}" },
        { ...io.createFile.meta, click: "{{io.createFile(path)}}" },
        "---",
        { label: "Select all", click: "{{selectAll()}}" }, //
      ]
      contextmenu(this, e, menu, this.stage)
    }
  }

  selectAll() {
    this.currentView.selectable.selectAll()
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

    if (this.view === "tree") {
      const out = []
      for (const path of dir) {
        const item = { path }
        if (path.endsWith("/")) item.items = () => this.getItems(path)
        out.push(item)
      }

      return out
    }

    return dir
  }

  render() {
    const common = {
      entry: "currentView",
      selection: "{{selection}}",
      selectionKey: "path",
      items: "{{getItems(path)}}",
      transferable: {
        selector: ":scope ui-icon",
        dropzone: "arrow",
        kind: "42_FILE",
        findNewIndex: false,
        import: ({ items, effect }) => {
          const paths = []
          for (const item of items) {
            paths.push(item.target.path)
          }

          if (effect === "copy") io.copyPath(paths, this.path)
          else io.movePath(paths, this.path)

          return false
        },
      },
    }

    return [
      {
        if: "{{view === 'tree'}}",
        do: {
          tag: "ui-tree.ui-folder__view",
          ...common,
          itemTemplate: {
            tag: "ui-icon",
            small: true,
            path: "{{path}}",
          },
        },
        else: {
          tag: "ui-grid.ui-folder__view",
          ...common,
          itemTemplate: {
            tag: "ui-icon",
            autofocus: "{{@first}}",
            path: "{{.}}",
          },
        },
      },
    ]
  }
}

export default Component.define(Folder)
