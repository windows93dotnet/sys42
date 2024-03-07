import explorer from "../components/explorer.js"
import isHashmapLike from "../../fabric/type/any/is/isHashmapLike.js"
import untilNextTask from "../../fabric/type/promise/untilNextTask.js"
import { objectifyPlan } from "../normalize.js"
import configure from "../../core/configure.js"
import getBasename from "../../core/path/core/getBasename.js"

const DEFAULT = {
  agree: "Save",
  decline: "Cancel",
  untitled: "untitled.txt",
}

export async function filePickerSave(path, options) {
  if (options !== undefined && !isHashmapLike(options)) {
    options = { data: options }
  }

  const config = { ...DEFAULT, ...options }
  const untitled = path
    ? path.endsWith("/")
      ? config.untitled
      : getBasename(path)
    : config.untitled

  const res = await explorer(
    path,
    configure(
      {
        label: "Save File - {{path}}",

        isPicker: true,

        dialog: {
          class: [
            "ui-dialog-explorer",
            "ui-dialog-filepicker",
            "ui-dialog-filepicker--save",
          ],
          state: {
            name: `${untitled}`,
          },
          footer: [
            {
              tag: "input.w-full",
              bind: "name",
              watch: {
                selection: `{{
                  name = selection.length > 0
                    ? path.getBasename(selection/-1)
                    : name
                }}`,
              },
              autofocus: true,
              compact: true,
              enterKeyHint: "done",
              on: {
                Enter: "{{ok()}}",
                focus: "{{path.getStemname(target.value) |> field.select(^^)}}",
              },
            },
            {
              tag: "button.ui-dialog__agree.btn-default",
              click: "{{ok()}}",
              ...objectifyPlan(config.agree),
            },
            {
              tag: "button.ui-dialog__decline",
              click: "{{close()}}",
              ...objectifyPlan(config.decline),
            },
          ],
        },
      },
      options,
    ),
  )

  const { data } = res
  if (!res.ok || !data.name) return { ok: false }

  await untilNextTask()

  if (!data.path.endsWith("/")) data.path += "/"
  path = data.path + data.name

  const out = {
    ok: true,
    path,
    // dir: data.path,
    // base: data.name,
  }

  if (options && "data" in options) {
    const fs = await import("../../core/fs.js").then((m) => m.default)
    const { encoding } = options
    try {
      await fs.write(path, options.data, { encoding })
      out.saved = true
    } catch (err) {
      out.error = err
      out.saved = false
    }
  }

  return out
}

export default filePickerSave
