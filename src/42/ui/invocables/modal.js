import dialog from "../components/dialog.js"
import preload from "../../core/load/preload.js"
import configure from "../../core/configure.js"
import forceOpener from "../forceOpener.js"
import { objectifyDef } from "../normalize.js"

const DEFAULT = {
  class: "dialog-modal",
  role: "alertdialog",
  agree: "Ok",
  decline: "Cancel",
}

export default async function modal(options) {
  const config = { ...DEFAULT, ...options }
  config.dialog ??= {}
  forceOpener(config.dialog)

  let { content } = config

  content = { tag: ".dialog-modal__content.box-h", content }

  let src = config.img

  if (config.icon) {
    const theme = await import("../../os/managers/themeManager.js").then(
      (m) => m.default
    )
    src = theme.getIconImage(config.icon)
  }

  if (src) {
    content = {
      tag: ".box-v",
      content: [
        {
          tag: ".dialog-modal__image.box-center.item-shrink.pa",
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
                tag: "button.dialog__agree.btn-default",
                click: "{{ok()}}",
                ...objectifyDef(config.agree),
              },
          config.decline === false
            ? undefined
            : {
                tag: "button.dialog__decline",
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
