import "./icon.js"
import "./tree.js"
import "./grid.js"
import Component from "../classes/Component.js"
import configure from "../../core/configure.js"
import fileIndex from "../../core/fileIndex.js"
import os from "../../os/actions.js"
import normalizeDirname from "../../core/fs/normalizeDirname.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import contextMenu from "../invocables/contextMenu.js"
import getBasename from "../../core/path/core/getBasename.js"

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
      showHiddenFiles: {
        type: "boolean",
        default: false,
        update: "refresh",
      },
      transferable: { type: "any", trait: true, default: true },
      selectable: { type: "any", default: true },
    },

    on: [
      // icon actions
      // ============
      {
        "selector": 'ui-icon[aria-description="file"]',
        "dblclick || Enter || Space": "{{os.launchFile(target.path)}}",
      },
      {
        "selector": 'ui-icon[aria-description="folder"]',
        "dblclick || Enter || Space": "{{os.launchFolder(target.path)}}",
      },
      {
        "selector": 'ui-icon[aria-description="shortcut"]',
        "dblclick || Enter || Space": "{{os.exec(target.infos.exec)}}",
      },
      {
        prevent: true,
        [os.createFolder.meta.shortcut]: "{{os.createFolder(path)}}",
        [os.deleteFile.meta.shortcut]: "{{os.deleteFile(selection)}}",
        [os.renameFile.meta.shortcut]: "{{os.renameFile(selection)}}",
      },
      {
        disrupt: true,
        contextmenu: "{{displayContextMenu(e, target)}}",
      },
    ],
  };

  [_updatePath](initial) {
    const path = normalizeDirname(this.path)

    if (
      this[_forgetWatch]?.path === path &&
      this[_forgetWatch]?.view === this.view
    ) {
      return
    }

    this.stage.reactive.now(() => {
      this.stage.reactive.set(this.stage.scope + "/path", path, {
        silent: true,
      })
    })

    if (!initial) this.currentView.selectable.clear()

    let timerId
    const { signal } = this.stage
    const pattern = path + (this.view === "tree" ? "**" : "*")

    this[_forgetWatch]?.()
    this[_forgetWatch] = fileIndex.watch(
      pattern,
      { signal },
      (changed, type) => {
        if (!this.stage) return

        clearTimeout(timerId)

        const { selection } = this

        if (type === "delete") {
          if (selection.includes(changed)) removeItem(selection, changed)
          changed += "/"
          if (selection.includes(changed)) removeItem(selection, changed)
        }

        timerId = setTimeout(() => {
          this.refresh(changed)
        }, 50)
      },
    )
    this[_forgetWatch].path = path
    this[_forgetWatch].view = this.view
  }

  go(path) {
    this.path = path
  }

  refresh() {
    if (!this.stage) return
    this.stage.reactive.now(() => {
      this.stage.reactive.refresh(this.stage.scope + "/path")
    })
  }

  displayContextMenu(e, target) {
    const icon = target.closest("ui-icon")

    if (icon) {
      this.currentView.selectable.ensureSelected(icon)
      let menu
      let hasFolders = false
      let hasFiles = false
      for (const path of this.selection) {
        if (path.endsWith("/")) hasFolders = true
        else hasFiles = true
      }

      if (hasFolders) {
        menu = hasFiles ? os.fileContextMenu : os.folderContextMenu
      } else menu = os.fileContextMenu

      contextMenu(icon, e, menu, this.stage)
    } else {
      this.currentView.selectable.clear()
      const menu = [
        { ...os.createFolder.meta, click: "{{os.createFolder(path)}}" },
        { ...os.createFile.meta, click: "{{os.createFile(path)}}" },
        "---",
        { label: "Select all", click: "{{selectAll()}}" },
      ]
      contextMenu(this, e, menu, this.stage)
    }
  }

  selectAll() {
    this.currentView.selectable.selectAll()
  }

  async getItems(path) {
    let dir
    try {
      dir = await (this.glob
        ? fileIndex.glob(
            path.endsWith("*") || //
              (!path.startsWith(".") && path.includes("."))
              ? path
              : path + "*",
          )
        : fileIndex.readDir(path, { absolute: true }))
      this.err = undefined
    } catch (err) {
      this.err = err.message
      dir = []
    }

    if (this.showHiddenFiles !== true) {
      dir = dir.filter((item) => !getBasename(item).startsWith("."))
    }

    if (this.view === "tree") {
      const out = []
      for (const path of dir) {
        const item = { path }
        if (path.endsWith("/")) item.items = async () => this.getItems(path)
        out.push(item)
      }

      return out
    }

    return dir
  }

  render({ transferable, selectable }) {
    const common = {
      entry: "currentView",
      selectable,
      multiselectable: "{{multiselectable}}",
      selection: "{{selection}}",
      selectionKey: "path",
      items: "{{getItems(path)}}",
      transferable: transferable
        ? configure(
            {
              selector: ":scope ui-icon",
              dropzone: "dim",
              findNewIndex: false,
              kind: "42_TR_ICON",
              accept: { mimetype: "*" },
              effects: ["move", "copy"],
            },
            transferable,
            {
              export({ items }) {
                items.details = { paths: [], dataTypes: [] }
                for (const item of items) {
                  items.details.dataTypes.push(item.target.infos.mime)
                  items.details.paths.push(item.target.path)
                }
              },
              import: (details) => {
                const res = transferable?.import?.(details)
                if (res !== undefined) return res

                const { paths, files, folders, effect, isOriginDropzone } =
                  details

                if (isOriginDropzone && effect === "move") return "revert"

                if (paths) {
                  if (effect === "copy") os.copyPath(paths, this.path)
                  else os.movePath(paths, this.path)
                } else if (files || folders) {
                  import("../../core/fs.js").then(async ({ fs }) => {
                    const undones = []

                    for (const path of folders) {
                      undones.push(fs.writeDir(this.path + path))
                    }

                    for (const [path, file] of Object.entries(files)) {
                      undones.push(fs.write(this.path + path, file))
                    }

                    await Promise.all(undones)
                  })
                }

                return "vanish"
              },
            },
          )
        : false,
    }

    return [
      {
        if: "{{view === 'tree'}}",
        do: {
          tag: "ui-tree.ui-folder__view",
          ...common,
          itemTemplate: {
            tag: "ui-icon",
            aria: { selected: false },
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
            aria: { selected: false },
            autofocus: "{{@first}}",
            path: "{{.}}",
          },
        },
      },
    ]
  }
}

export default Component.define(Folder)
