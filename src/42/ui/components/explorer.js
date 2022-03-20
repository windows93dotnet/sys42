import "./folderview.js"
import Component from "../class/Component.js"
import dirname from "../../fabric/type/path/extract/dirname.js"
import render from "../render.js"
import dialog from "./dialog.js"

function displayError(err) {
  const div = document.createElement("div")
  div.role = "alert"
  div.className = "ui-error"
  const details = document.createElement("details")
  const summary = document.createElement("summary")
  const samp = document.createElement("samp")
  samp.className = "inset"

  summary.append(err.message)
  samp.append(err.stack)
  details.append(summary, samp)
  div.append(details)
  // details.open = true
  return div
}

export class Explorer extends Component {
  static definition = {
    tag: "ui-explorer",

    properties: {
      path: {
        state: true,
        type: "string",
        reflect: true,
        render: true,
        default: "/",
      },
      glob: {
        state: true,
        type: "boolean",
        fromView: true,
        render: true,
      },
      selection: {
        state: true,
        type: "array",
        default: [],
      },
    },

    shortcuts: [
      {
        key: "[click]",
        selector: "ui-icon",
        run: "select",
        args: ["target.path"],
      },
      {
        key: "Ctrl+[click]",
        selector: "ui-icon",
        run: "select",
        args: ["target.path", true],
      },
      {
        key: "[dblclick]",
        selector: 'ui-icon[aria-description="folder"]',
        run: "go",
        args: ["target.path"],
      },
    ],
  }

  select(path, add) {
    if (add !== true) this.selection.length = 0
    this.selection.push(path)
  }

  folderUp() {
    let path = dirname(this.path)
    if (!path.endsWith("/")) path += "/"
    this.go(path)
  }

  go(path) {
    this.selection.length = 0
    this.path = path
  }

  displaySelection(selection) {
    return selection.length > 1
      ? JSON.stringify(selection).slice(1, -1)
      : selection[0]
  }

  $render() {
    this.querySelector(".message").replaceChildren()
  }

  $create({ root, ctx }) {
    this.addEventListener("patherror", ({ error }) => {
      this.querySelector(".message").replaceChildren(displayError(error))
    })

    const content = [
      {
        type: "header.box-v.ctrl-group.mb-xs",
        content: [
          {
            type: "button",
            picto: "arrow-up",
            run: "folderUp",
          },
          {
            type: "input",
            name: "path",
            compact: true,
            prose: false,
            enterkeyhint: "go",
          },
        ],
      },
      {
        type: "ui-folderview.inset",
        autofocus: true,
        glob: { watch: "glob" },
        path: { watch: "path" },
        selection: { watch: "selection" },
      },
      {
        type: ".message",
      },
      {
        type: "footer.w-full.mt-xs.ma-0.box-v",
        content: [
          {
            type: ".py-xs.px-md.mr-xs.inset-shallow.panel.item-shrink",
            content: "{{items.length}} {{'item'|pluralize(items.length)}}",
          },
          {
            type: "input.inset-shallow.panel",
            value: "{{selection|displaySelection}}",
            readonly: true,
            compact: true,
          },
        ],
      },
    ]

    root.append(render(content, ctx))
  }
}

await Component.define(Explorer)

export default async function explorer(path, options = {}) {
  return dialog({
    label: "{{path}}",
    style: { width: "400px", height: "350px" },
    modules: options.modules,
    menubar: [
      {
        label: "File",
        content: [
          { label: "Open" }, //
        ],
      },
      {
        label: "Edit",
        content: [
          { label: "Copy" },
          { label: "Cut" },
          { label: "Paste" },
          "---",
          { label: "Select all" },
        ],
      },
    ],
    content: {
      type: "ui-explorer",
      path: { watch: "path" },
      selection: { watch: "selection" },
    },
    footer: options.footer ? options.footer : false,
    data: { path, selection: options.selection ?? [] },
  })
}

function getDir(path, defaultPath = "/") {
  let out = path ? dirname(path) : defaultPath
  out = out === "." ? defaultPath : out
  if (!out.endsWith("/")) out += "/"
  return out
}

export async function pickFile(path, options = {}) {
  const res = await explorer(getDir(path, options.defaultPath), {
    modules: { apply: "./dialog/selection.apply.js" },
    selection: [path],
    footer: {
      type: ".w-full.items-end.box-v.ma-sm.gap-sm",
      content: [
        { type: "button", label: "Cancel", run: "cancel" },
        { type: "button.btn-default", label: "Open", run: "ok" },
      ],
    },
    ...options,
  })

  return res.ok
    ? {
        path: res.value.path,
        files: res.value.files,
        selection: res.value.selection,
      }
    : undefined
}

export async function saveFile(path, options = {}) {
  const res = await explorer(getDir(path, options.defaultPath), {
    selection: [path],
    footer: {
      type: ".w-full.items-end.box-v.ma-sm.gap-sm",
      content: [
        { type: "button", label: "Cancel", run: "cancel" },
        { type: "button.btn-default", label: "Save", run: "ok" },
      ],
    },
    ...options,
  })

  return res.ok ? {} : undefined
}

explorer.pick = pickFile
explorer.save = saveFile
