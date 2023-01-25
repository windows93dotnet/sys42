import "./icon.js"
import Component from "../classes/Component.js"
import configure from "../../core/configure.js"
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
      transferable: { type: "object" },
    },

    // dropzone: true,
    on: [
      // drag n drop
      // ===========
      // {
      //   async drop(e) {
      //     const { files, folders, paths } = await dt.import(e)
      //     if (paths) io.movePaths(paths, this.el.path)
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
        "dblclick || Enter || Space": "{{io.launchFiles(target.path)}}",
      },
      {
        "selector": 'ui-icon[aria-description="folder"]',
        "dblclick || Enter || Space": "{{io.launchFolders(target.path)}}",
      },
      {
        prevent: true,
        [io.createFolder.meta.shortcut]: "{{io.createFolder(path)}}",
        [io.deleteFiles.meta.shortcut]: "{{io.deleteFiles(selection)}}",
        [io.renameFiles.meta.shortcut]: "{{io.renameFiles(selection)}}",
      },
      {
        disrupt: true,
        contextmenu: "{{displayContextmenu(e, target)}}",
      },
    ],
  };

  [_updatePath](initial) {
    const path = normalizeDirname(this.path)

    this.stage.reactive.now(() => {
      this.stage.reactive.set(this.stage.scope + "/path", path, {
        silent: true,
      })
    })

    if (this[_forgetWatch]?.path === path) return

    if (!initial) this.selection.length = 0

    const { signal } = this.stage
    const options = { signal }

    this[_forgetWatch]?.()
    this[_forgetWatch] = disk.watchDir(path, options, (changed, type) => {
      if (!this.stage) return

      const { selection } = this

      if (type === "delete") {
        if (selection.includes(changed)) removeItem(selection, changed)
        changed += "/"
        if (selection.includes(changed)) removeItem(selection, changed)
      }

      this.refresh()
    })
    this[_forgetWatch].path = path
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

  render({ transferable }) {
    const common = {
      entry: "currentView",
      selection: "{{selection}}",
      selectionKey: "path",
      items: "{{getItems(path)}}",
      transferable: configure(
        {
          selector: ":scope ui-icon",
          dropzone: "arrow",
          findNewIndex: false,
          kind: "$file",
        },
        transferable,
        {
          import: (details) => {
            const res = transferable?.import?.(details)
            if (res !== undefined) return res

            const { items, effect, isOriginDropzone } = details
            if (isOriginDropzone) return "revert"

            const paths = []
            for (const item of items) {
              const path = item.data?.path ?? item.target.path
              if (path) paths.push(path)
            }

            if (effect === "copy") io.copyPaths(paths, this.path)
            else io.movePaths(paths, this.path)

            return "vanish"
          },
        }
      ),
    }

    return [
      {
        if: "{{view === 'tree'}}",
        do: {
          tag: "ui-tree.ui-folder__view",
          ...common,
          itemTemplate: {
            tag: "ui-icon",
            autofocus: "{{@first}}",
            path: "{{path}}",
            small: true,
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
