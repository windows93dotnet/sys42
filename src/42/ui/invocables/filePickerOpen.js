import explorer from "../components/explorer.js"
import omit from "../../fabric/type/object/omit.js"
import { objectifyDef } from "../normalize.js"

const DEFAULT = {
  agree: "Open",
  decline: "Cancel",
}

export async function filePickerOpen(path, options) {
  const config = { ...DEFAULT, ...options }

  const res = await explorer(path, {
    label: "Open File - {{path}}",

    isPicker: true,

    dialog: {
      class:
        "ui-dialog-explorer ui-dialog-filepicker ui-dialog-filepicker--open",
      footer: [
        {
          tag: "input.w-full.inset-shallow._panel",
          value: "{{selection}}",
          tabIndex: -1,
          readonly: true,
          compact: true,
        },
        {
          tag: "button.ui-dialog__agree.btn-default",
          disabled: "{{selection.length === 0}}",
          click: "{{ok()}}",
          ...objectifyDef(config.agree),
        },
        {
          tag: "button.ui-dialog__decline",
          click: "{{close()}}",
          ...objectifyDef(config.decline),
        },
      ],
    },

    ...(options ? omit(options, ["files"]) : undefined),
  })

  if (!res.ok) return

  let files

  if (options?.files !== false) {
    const fs = await import("../../core/fs.js").then((m) => m.default)
    files = await Promise.all(
      res.selection.map((path) =>
        path.endsWith("/") ? undefined : fs.open(path)
      )
    )
  }

  return {
    path: res.path,
    selection: res.selection,
    files,
  }
}

export default filePickerOpen
