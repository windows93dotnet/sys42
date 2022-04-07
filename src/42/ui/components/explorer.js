import "./folderview.js"
import Component from "../class/Component.js"
import dirname from "../../fabric/type/path/extract/dirname.js"
import render from "../render.js"
import dialog from "./dialog.js"

import basename from "../../fabric/type/path/extract/basename.js"
import stemname from "../../fabric/type/path/extract/stemname.js"
import parsePath from "../../fabric/type/path/core/parsePath.js"

import bisect from "../../fabric/type/object/bisect.js"
import configure from "../../fabric/configure.js"

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

    defaults: {
      footer: undefined,
    },

    shortcuts: [
      {
        key: "[dblclick]",
        selector: 'ui-icon[aria-description="folder"]',
        run: "go",
        args: ["target.path"],
      },
    ],
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

  $create({ root, ctx, config, signal }) {
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
            autofocus: true,
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
      config.footer ?? {
        type: "footer.w-full.mt-xs.ma-0.box-v",
        content: [
          {
            type: ".py-xs.px-md.mr-xs.inset-shallow.panel.item-shrink",
            content: "{{items.length}} {{pluralize('item', items.length)}}",
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

    const saveFileInput = root.querySelector('[name="basename"]')
    if (saveFileInput) {
      const setValue = () => {
        if (this.selection.length > 0) {
          saveFileInput.value = basename(this.selection[0])
        }
      }

      setValue()

      ctx.global.state.on("update", { signal }, (queue) => {
        if (queue.has("selection")) setValue()
      })

      saveFileInput.addEventListener(
        "focus",
        async function () {
          queueMicrotask(() => {
            const stem = stemname(this.value)
            const start = this.value.indexOf(stem)
            if (start > -1) this.setSelectionRange(start, start + stem.length)
          })
        },
        { signal }
      )
    }
  }
}

await Component.define(Explorer)

export default async function explorer(path = "/", options = {}) {
  const [rest, config] = bisect(options, ["footer", "selection", "shortcuts"])

  const parsed = parsePath(path, { checkDir: true })

  config.selection ??= []
  if (parsed.base && config.selection.length === 0) {
    config.selection.push(parsed.dir + parsed.base)
  }

  path = parsed.dir === "/" ? parsed.dir : parsed.dir + "/"

  return dialog(
    configure(
      {
        label: "{{path}}",
        icon: "{{path}}",
        style: { width: "400px", height: "350px" },
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
          footer: config.footer,
          shortcuts: config.shortcuts ? config.shortcuts : false,
        },
        footer: false,
        data: { path, selection: config.selection ?? [] },
      },
      rest
    )
  )
}

/* exports
========== */

let fs

export async function pickFile(path, options = {}) {
  const res = await explorer(path, {
    label: "Open File",
    shortcuts: [
      {
        key: "[dblclick]",
        selector: 'ui-icon[aria-description="file"]',
        run: "ok",
      },
    ],
    footer: {
      type: "footer.items-end.box-v.ma-sm.gap-sm",
      content: [
        {
          type: "input.inset-shallow.panel",
          value: "{{selection|displaySelection}}",
          readonly: true,
          compact: true,
        },
        { type: "button", label: "Cancel", run: "cancel" },
        { type: "button.btn-default", label: "Open", run: "ok" },
      ],
    },
    ...options,
  })

  if (!res.ok) return

  fs ??= await import("../../system/fs.js").then((m) => m.default)

  const files = await Promise.all(
    res.value.selection.map((path) => fs.open(path))
  )

  return {
    path: res.value.path,
    selection: res.value.selection,
    files,
  }
}

export async function saveFile(path, options = {}, value) {
  const res = await explorer(path, {
    label: "Save File",
    shortcuts: [
      {
        key: "[dblclick]",
        selector: 'ui-icon[aria-description="file"]',
        run: "ok",
      },
    ],
    footer: {
      type: "footer.box-h.ma-sm.gap-sm",
      content: [
        {
          type: "input.inset-shallow.panel",
          value: "{{selection|displaySelection}}",
          readonly: true,
          compact: true,
        },
        {
          type: ".box-v.gap-sm",
          content: [
            {
              type: "input",
              id: "basename",
              name: "basename",
              compact: true,
              prose: false,
              // value: "{{stemname(selection.-1)}}{{extname(selection.-1)}}",
            },
            { type: "button", label: "Cancel", run: "cancel" },
            { type: "button.btn-default", label: "Save", run: "ok" },
          ],
        },
      ],
    },
    ...options,
  })

  if (!res.ok || !res.value.basename) return

  if (!res.value.path.endsWith("/")) res.value.path += "/"
  const filename = res.value.path + res.value.basename

  if (value === undefined) return filename

  fs ??= await import("../../system/fs.js").then((m) => m.default)

  return fs.write(filename, value)
}

explorer.pick = pickFile
explorer.save = saveFile
