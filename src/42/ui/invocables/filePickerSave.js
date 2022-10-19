import explorer from "../components/explorer.js"
import isHashmapLike from "../../fabric/type/any/is/isHashmapLike.js"
import nextCycle from "../../fabric/type/promise/nextCycle.js"
import { objectifyDef } from "../normalize.js"

const DEFAULT = {
  agree: "Save",
  decline: "Cancel",
  untitled: "untitled.txt",
}

export default async function filePickerSave(path, options) {
  const config = { ...DEFAULT, ...options }
  const { untitled } = config

  const res = await explorer(path, {
    label: "Save File - {{path}}",

    isPicker: true,

    dialog: {
      class:
        "ui-dialog-explorer ui-dialog-filepicker ui-dialog-filepicker--save",
      footer: [
        {
          tag: "input.w-full",
          watch: "/name",
          value: `{{selection.length > 0
            ? path.getBasename(selection/-1)
            : this.value || '${untitled}'}}`,
          autofocus: true,
          compact: true,
          enterKeyHint: "done",
          on: {
            Enter: "{{ok()}}",
            focus: "{{path.getStemname(target.value) |> field.select}}",
          },
        },
        {
          tag: "button.ui-dialog__agree.btn-default",
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
    try {
      await fs.write(path, options.data, { encoding })
      saved = true
    } catch {
      saved = false
    }
  }

  return {
    saved,
    path,
    dir: res.path,
    base: res.name,
  }
}
