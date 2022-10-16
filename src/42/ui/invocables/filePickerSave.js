import explorer from "../components/explorer.js"
import isHashmapLike from "../../fabric/type/any/is/isHashmapLike.js"
import nextCycle from "../../fabric/type/promise/nextCycle.js"

export default async function filePickerSave(path, options) {
  const untitled = options?.untitled ?? "untitled.txt"

  const res = await explorer(path, {
    label: "Save File - {{path}}",

    isPicker: true,

    dialog: {
      class: "dialog-explorer dialog-filepicker dialog-filepicker--save",
      footer: [
        {
          tag: "input.w-full",
          watch: "/name",
          value: `{{selection.length > 0
            ? path.getBasename(selection/0)
            : this.value || '${untitled}'}}`,
          autofocus: true,
          compact: true,
          enterKeyHint: "done",
          on: {
            Enter: "{{ok()}}",
            focus: "{{path.getStemname(target.value) |> field.select}}",
          },
        },
        { tag: "button.btn-default", label: "Save", click: "{{ok()}}" },
        { tag: "button", label: "Cancel", click: "{{close()}}" },
      ],
    },

    ...options,
  })

  if (!res.ok || !res.name) return

  await nextCycle()

  let saved

  if (!res.path.endsWith("/")) res.path += "/"
  path = res.path + res.name

  if (options !== undefined && !isHashmapLike(options)) {
    options = { data: options }
  }

  if (options && "data" in options) {
    const fs = await import("../../core/fs.js").then((m) => m.default)
    const { encoding } = options
    saved = await fs.write(path, options.data, { encoding })
  }

  return {
    dir: res.path,
    base: res.name,
    path,
    saved,
  }
}
