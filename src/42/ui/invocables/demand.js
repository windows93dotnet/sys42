import dialog from "../components/dialog.js"
import { objectifyPlan } from "../normalize.js"
import ensureOpener from "../utils/ensureOpener.js"
import configure from "../../core/configure.js"

const DEFAULT = {
  class: "ui-dialog-demand",
  role: "alertdialog",
  agree: "Ok",
  decline: "Cancel",
}

export async function demand(options) {
  const config = { ...DEFAULT, ...options }
  config.dialog ??= {}
  ensureOpener(config.dialog)

  let { content } = config

  content = { tag: ".ui-dialog-demand__content.box-v", content }

  let src = config.img

  if (config.icon) {
    const { themeManager } = await import("../../os/managers/themeManager.js")
    src = await themeManager.getIconPath(config.icon)
  }

  if (src) {
    content = {
      tag: ".box-h.item-shrink",
      content: [
        {
          tag: ".ui-dialog-demand__image.box-center.item-shrink.pa",
          content: { tag: "img", aria: { hidden: true }, src },
        },
        content,
      ],
    }
  }

  if (options.beforeContent || options.afterContent) {
    content = {
      tag: ".box-v.items-nowrap.item-spread",
      content: [
        options.beforeContent, //
        content,
        options.afterContent,
      ],
    }
  }

  return dialog(
    configure(
      {
        returnsData: true,
        label: config.label,
        class: config.class,
        role: config.role,
        x: config.x,
        y: config.y,
        width: config.width,
        height: config.height,
        content,
        footer: config.footer ?? [
          config.agree === false
            ? undefined
            : {
                tag: "button.ui-dialog__agree",
                click: "{{ok()}}",
                ...objectifyPlan(config.agree),
              },
          config.decline === false
            ? undefined
            : {
                tag: "button.ui-dialog__decline",
                click: "{{close()}}",
                ...objectifyPlan(config.decline),
              },
        ],
        state: {
          value: config.value,
        },
      },
      config.dialog,
    ),
  )
}

export default demand
