import explorer from "../components/explorer.js"
import stemname from "../../fabric/type/path/extract/stemname.js"

export default async function filePickerSave(path, options) {
  const res = await explorer(path, {
    label: "Save File - {{path}}",

    isPicker: true,

    dialog: {
      class: "dialog-explorer dialog-filepicker dialog-filepicker--save",
      footer: [
        {
          tag: "input.w-full",
          scope: "name",
          value:
            "{{selection.length > 0 ? basename(selection.0) : this.value}}",
          autofocus: true,
          compact: true,
          enterKeyHint: "done",
          on: {
            Enter: "{{ok()}}",
            async focus({ target }) {
              this.state.selection.length = 0
              const { value } = target
              const stem = stemname(value)
              const start = value.indexOf(stem)
              target.setSelectionRange(0, 0)
              start > -1
                ? target.setSelectionRange(start, start + stem.length)
                : target.setSelectionRange(0, value.length)
            },
          },
        },
        { tag: "button", label: "Cancel", click: "{{close()}}" },
        { tag: "button.btn-default", label: "Save", click: "{{ok()}}" },
      ],
    },

    ...options,
  })

  if (!res.ok) return

  return {
    path: res.path,
    basename: res.name,
  }
}
