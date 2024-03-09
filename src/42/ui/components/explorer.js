import Component from "../classes/Component.js"
import configure from "../../core/configure.js"
import getDirname from "../../core/path/core/getDirname.js"
import dialog from "./dialog.js"
import open from "../../os/commands/open.cmd.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import keyboard from "../../core/devices/keyboard.js"
import { focusInside } from "../../fabric/dom/focus.js"

import parsePath from "../../core/path/core/parsePath.js"
import joinPath from "../../core/path/core/joinPath.js"
import normalizeFilename from "../../core/fs/normalizeFilename.js"
import normalizeDirname from "../../core/fs/normalizeDirname.js"

export class Explorer extends Component {
  static plan = {
    tag: "ui-explorer",

    props: {
      path: {
        type: "string",
        reflect: true,
        default: "/",
      },
      view: {
        type: "string",
        reflect: true,
        default: "grid",
      },
      glob: {
        type: "boolean",
        fromView: true,
      },
      isPicker: {
        type: "boolean",
      },
      multiselectable: {
        type: "boolean",
        fromView: true,
        default: true,
      },
      selection: {
        type: "array",
        default: [],
      },
      showHiddenFiles: {
        type: "boolean",
        default: true,
      },
    },

    on: [
      {
        "stop": true,
        "capture": true,
        "selector": 'ui-icon[aria-description="folder"]',
        "dblclick || Enter || Space": "{{go(target.path)}}",
      },
      {
        "stop": true,
        "capture": true,
        "selector": 'ui-icon[aria-description="file"]',
        "dblclick || Enter || Space":
          "{{isPicker ? pick(target) : open(target.path)}}",
      },
      {
        "Alt+Up": "{{folderUp()}}",
      },
    ],
  }

  pick(target) {
    this.folder.currentView.selectable.ensureSelected(target)
    this.dialog.ok()
  }

  resetFocus() {
    document.activeElement.blur()
    queueTask(() => focusInside(this.folder) || this.folder.focus())
  }

  folderUp(options) {
    let path = getDirname(this.path)
    if (!path.endsWith("/")) path += "/"
    this.path = path
    if (!options?.keepFocus) this.resetFocus()
  }

  go(path, options) {
    if (keyboard.keys.Control) return // TODO: check how to do this in template
    this.path = path

    if (this.folder.err) {
      this.message.textContent = this.folder.err
    } else {
      this.message.textContent = ""
      if (!options?.keepFocus) this.resetFocus()
    }
  }

  open(path) {
    if (keyboard.keys.Control) return
    open(path)
  }

  displaySelection(selection) {
    return selection.length > 1
      ? JSON.stringify(selection).slice(1, -1)
      : selection[0]
  }

  // async getItemsLength() {
  //   await this.dialog.ready
  //   return this.folder.currentView.items.length
  // }

  render() {
    return [
      {
        tag: "ui-menubar",
        items: [
          {
            label: "File",
            items: [
              { if: "{{dialog}}", label: "Exit", click: "{{dialog.close()}}" }, //
            ],
          },
          {
            label: "View",
            items: [
              { label: "Select all", click: "{{folder.selectAll()}}" }, //
              {
                label: "Show hidden files",
                tag: "checkbox",
                bind: "showHiddenFiles",
                shortcut: "Ctrl+H",
              },
            ],
          },
        ],
      },
      {
        tag: "header.box-h.gap-sm.ma-b-xs",
        content: [
          {
            tag: "button",
            picto: "up",
            aria: { label: "Go up" },
            click: "{{folderUp()}}",
            disabled: "{{path === '/'}}",
          },
          {
            tag: ".box-h",
            content: [
              {
                tag: "input",
                bind: "path",
                debounce: true,
                compact: true,
                prose: false,
                enterKeyHint: "go",
                on: {
                  Enter: "{{go(target.value)}}",
                  focus({ target }) {
                    const { length } = target.value
                    target.selectionStart = length
                    target.selectionEnd = length
                  },
                },
              },
              {
                tag: "button",
                picto: "loop",
                aria: { label: "Refresh" },
                // click: "{{folder.refresh()}}", // TODO: fix unfound ui entries
                click: () => {
                  this.folder.refresh()
                },
              },
            ],
          },
          {
            tag: ".toggle-group",
            content: [
              {
                tag: "radio",
                bind: "view",
                value: "grid",
                label: { picto: "grid", aria: { label: "Grid view" } },
              },
              {
                tag: "radio",
                bind: "view",
                value: "tree",
                label: { picto: "tree", aria: { label: "Tree view" } },
              },
            ],
          },
        ],
      },
      {
        entry: "folder",
        tag: "ui-folder.inset.paper",
        path: "{{path}}",
        view: "{{view}}",
        glob: "{{glob}}",
        selection: "{{selection}}",
        multiselectable: "{{multiselectable}}",
        showHiddenFiles: "{{showHiddenFiles}}",
      },
      {
        entry: "message",
        tag: ".message",
      },
      {
        if: "{{!isPicker}}",
        tag: "footer.w-full.ma-t-xs.ma-0.box-h",
        content: [
          // {
          //   tag: ".pa-y-xs.pa-x-md.ma-r-xs.inset-shallow.panel.item-shrink",
          //   // content:
          //   //   "{{folder.currentView.items.length}} {{pluralize('item', folder.currentView.items.length)}}",
          //   // content:
          //   //   "{{getItemsLength(path)}} {{pluralize('item', folder.currentView.items.length)}}",
          // },
          {
            tag: "input.inset-shallow.panel",
            value: "{{displaySelection(selection)}}",
            label: "Selected paths",
            readonly: true,
            compact: true,
          },
        ],
      },
    ]
  }
}

Component.define(Explorer)

export async function explorer(path = "/", options) {
  const selection = options?.selection ?? []
  const glob = options?.glob ?? false
  const view = options?.view ?? "grid"

  const parsed = parsePath(
    path.endsWith("/") ? normalizeDirname(path) : normalizeFilename(path),
    { checkDir: true },
  )

  if (parsed.base && selection.length === 0) {
    selection.push(joinPath(parsed.dir, parsed.base))
  }

  path = parsed.dir === "/" ? parsed.dir : parsed.dir + "/"

  return dialog(
    configure(
      {
        returnsData: true,
        label: options?.label ?? "{{path}}",
        icon: "{{path}}",
        class: "ui-dialog-explorer",
        style: { width: "400px", height: "350px" },

        content: {
          entry: "explorer",
          tag: "ui-explorer",
          path: "{{path}}",
          selection: "{{selection}}",
          glob: "{{glob}}",
          view: "{{view}}",
          isPicker: options?.isPicker,
          parentEntry: "dialog",
        },

        state: { path, selection, glob, view },
      },
      options?.dialog,
    ),
  )
}

export default explorer
