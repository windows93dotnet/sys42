import explorer from "../components/explorer.js"
import omit from "../../fabric/type/object/omit.js"
import { objectifyDef } from "../normalize.js"

const DEFAULT = {
  agree: "Open",
  decline: "Cancel",
}

export default async function filePickerOpen(path, options) {
  const config = { ...DEFAULT, ...options }

  const res = await explorer(path, {
    label: "Open File - {{path}}",

    isPicker: true,

    dialog: {
      class: "dialog-explorer dialog-filepicker dialog-filepicker--open",
      footer: [
        {
          tag: "input.w-full.inset-shallow._panel",
          value: "{{selection}}",
          tabIndex: -1,
          readonly: true,
          compact: true,
        },
        {
          tag: "button.dialog__agree.btn-default",
          click: "{{ok()}}",
          ...objectifyDef(config.agree),
        },
        {
          tag: "button.dialog__decline",
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
