import dialog from "../components/dialog.js"
import configure from "../../core/configure.js"

const DEFAULT = {
  class: "dialog-modal",
  role: "alertdialog",
  ok: "Ok",
  cancel: "Cancel",
}

export default async function modal(options) {
  const config = { ...DEFAULT, ...options }

  let { content } = config

  content = { tag: ".dialog-modal__content.box-h", content }

  let src = config.img

  if (config.icon) {
    const theme = await import("../../os/theme.js").then((m) => m.default)
    src = theme.getIconImage(config.icon)
  }

  if (src) {
    content = {
      tag: ".box-v",
      content: [
        {
          tag: ".dialog-modal__image.box-center.item-shrink.pa",
          content: { tag: "img", src },
        },
        content,
      ],
    }
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
          config.ok === false
            ? undefined
            : {
                tag: "button.btn-default",
                label: config.ok,
                click: "{{ok()}}",
              },
          config.cancel === false
            ? undefined
            : { tag: "button", label: config.cancel, click: "{{close()}}" },
        ],
        state: {
          text: config.value,
        },
      },
      config.dialog
    )
  )
}
