import explorer from "../components/explorer.js"
import { objectifyPlan } from "../normalize.js"
import omit from "../../fabric/type/object/omit.js"

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
      class: [
        "ui-dialog-explorer",
        "ui-dialog-filepicker",
        "ui-dialog-filepicker--open",
      ],
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
          ...objectifyPlan(config.agree),
        },
        {
          tag: "button.ui-dialog__decline",
          click: "{{close()}}",
          ...objectifyPlan(config.decline),
        },
      ],
    },

    ...(options ? omit(options, ["files"]) : undefined),
  })

  if (!res.ok) return { ok: false }

  const { data } = res

  const out = {
    ok: true,
    dir: data.path,
    selection: data.selection,
  }

  if (options?.files !== false) {
    const fs = await import("../../core/fs.js").then((m) => m.default)
    out.files = await Promise.all(
      data.selection.map((path) =>
        path.endsWith("/") ? undefined : fs.open(path),
      ),
    )
  }

  return out
}

export default filePickerOpen
