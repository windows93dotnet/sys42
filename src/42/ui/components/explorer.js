import Component from "../class/Component.js"
import dirname from "../../fabric/type/path/extract/dirname.js"
import dialog from "./dialog.js"
import open from "../../os/cmd/open.cmd.js"

import parsePath from "../../fabric/type/path/core/parsePath.js"
import joinPath from "../../fabric/type/path/core/joinPath.js"
import normalizePath from "../../fabric/type/path/core/normalizePath.js"

export class Explorer extends Component {
  static definition = {
    tag: "ui-explorer",

    props: {
      path: {
        type: "string",
        reflect: true,
        default: "/",
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
        "stop": true,
        "selector": 'ui-icon[aria-description="folder"]',
        "dblclick || Enter || Space": "{{go(target.path)}}",
      },
      {
        "stop": true,
        "selector": 'ui-icon[aria-description="file"]',
        "dblclick || Enter || Space": "{{open(target.path)}}",
      },
      {
        "Alt+Up": "{{folderUp()}}",
      },
    ],

    content: [
      {
        tag: "header.box-v.ctrl-group.mb-xs",
        content: [
          {
            tag: "button",
            picto: "up",
            click: "{{folderUp()}}",
            disabled: "{{path === '/'}}",
          },
          {
            tag: "input",
            scope: "path",
            enterKeyHint: "go",
            compact: true,
            prose: false,
          },
        ],
      },
      {
        tag: "ui-folder.inset.paper",
        autofocus: true,
        glob: "{{glob}}",
        path: "{{path}}",
        selection: "{{selection}}",
      },
      {
        tag: ".message",
      },
      {
        tag: "footer.w-full.mt-xs.ma-0.box-v",
        content: [
          {
            tag: ".py-xs.px-md.mr-xs.inset-shallow.panel.item-shrink",
            content: "{{items.length}} {{pluralize('item', items.length)}}",
          },
          {
            tag: "input.inset-shallow.panel",
            value: "{{displaySelection(selection)}}",
            readonly: true,
            compact: true,
          },
        ],
      },
    ],
  }

  folderUp() {
    let path = dirname(this.path)
    if (!path.endsWith("/")) path += "/"
    this.path = path
  }

  go(path) {
    this.path = path
  }

  open(path) {
    open(path)
  }

  displaySelection(selection) {
    return selection.length > 1
      ? JSON.stringify(selection).slice(1, -1)
      : selection[0]
  }
}

Component.define(Explorer)

export default async function explorer(path = "/", options) {
  const selection = options?.selection ?? []

  const parsed = parsePath(normalizePath(path), { checkDir: true })

  if (parsed.base && selection.length === 0) {
    selection.push(joinPath(parsed.dir, parsed.base))
  }

  path = parsed.dir === "/" ? parsed.dir : parsed.dir + "/"

  return dialog({
    label: "{{path}}",
    icon: "{{path}}",
    style: { width: "400px", height: "350px" },

    content: {
      tag: "ui-explorer",
      path: "{{path}}",
      selection: "{{selection}}",
    },

    state: { path, selection },

    ...options?.dialog,
  })
}
