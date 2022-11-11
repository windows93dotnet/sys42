import dialog from "../components/dialog.js"
import preload from "../../core/load/preload.js"
import configure from "../../core/configure.js"
import forceOpener from "../forceOpener.js"
import { objectifyDef } from "../normalize.js"

const DEFAULT = {
  class: "ui-dialog-demand",
  role: "alertdialog",
  agree: "Ok",
  decline: "Cancel",
}

export async function demand(options) {
  const config = { ...DEFAULT, ...options }
  config.dialog ??= {}
  forceOpener(config.dialog)

  let { content } = config

  content = { tag: ".ui-dialog-modal__content.box-v", content }

  let src = config.img

  if (config.icon) {
    const theme = await import("../../os/managers/themeManager.js").then(
      (m) => m.default
    )
    src = theme.getIconImage(config.icon)
  }

  if (src) {
    content = {
      tag: ".box-h",
      content: [
        {
          tag: ".ui-dialog-modal__image.box-center.item-shrink.pa",
          content: { tag: "img", aria: { hidden: true }, src },
        },
        content,
      ],
    }
    await preload(src, { as: "image" })
  }

  return dialog(
    configure(
      {
        label: config.label,
        class: config.class,
        role: config.role,
        aria: { modal: true },
        content,
        footer: config.footer ?? [
          config.agree === false
            ? undefined
            : {
                tag: "button.ui-dialog__agree.btn-default",
                click: "{{ok()}}",
                ...objectifyDef(config.agree),
              },
          config.decline === false
            ? undefined
            : {
                tag: "button.ui-dialog__decline",
                click: "{{close()}}",
                ...objectifyDef(config.decline),
              },
        ],
        state: {
          value: config.value,
        },
      },
      config.dialog
    )
  )
}

export default demand
