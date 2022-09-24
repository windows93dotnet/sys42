import explorer from "../components/explorer.js"
import omit from "../../fabric/type/object/omit.js"

export default async function filePickerOpen(path, options) {
  const res = await explorer(path, {
    label: "Open File - {{path}}",

    isPicker: true,

    dialog: {
      class: "dialog-explorer dialog-filepicker dialog-filepicker--open",
      footer: [
        {
          tag: "input.w-full.inset-shallow._panel",
          value: "{{selection}}",
          readonly: true,
          compact: true,
        },
        { tag: "button", label: "Cancel", click: "{{close()}}" },
        { tag: "button.btn-default", label: "Open", click: "{{ok()}}" },
      ],
    },

    ...(options ? omit(options, ["files"]) : undefined),
  })

  if (!res.ok) return

  let files
  if (options?.files !== false) {
    const fs = await import("../../core/fs.js").then((m) => m.default)
    files = await Promise.all(res.selection.map((path) => fs.open(path)))
  }

  return {
    path: res.path,
    selection: res.selection,
    files,
  }
}
