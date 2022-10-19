import modal from "./modal.js"
import uid from "../../core/uid.js"
import forceOpener from "../forceOpener.js"
import isErrorLike from "../../fabric/type/any/is/isErrorLike.js"

const DEFAULT = {
  label: "Alert",
  class: "dialog-modal dialog-alert",
  decline: false,
}

export default async function alert(message = "", options = {}) {
  const config = { ...DEFAULT, ...options }
  config.dialog ??= {}
  forceOpener(config.dialog)

  if (isErrorLike(message)) {
    const error = await import("../../fabric/type/error/normalizeError.js") //
      .then((m) => m.default(message))
    options.icon ??= "error"
    options.label ??= error.name
    message = options.message ?? error.message
    if (error.stack && error.stack !== error.message) {
      const [logAsContent, formated] = await Promise.all([
        import("../../core/console/logAsContent.js") //
          .then((m) => m.default),
        import("../../core/console/formats/formatError.js") //
          .then((m) => m.default(error, options.formatError)),
      ])
      const content = logAsContent(formated)
      const sampId = uid()
      const btnId = uid()
      options.dialog ??= {}
      options.dialog.footer = {
        $patch: [
          {
            op: "add",
            path: "/0",
            value: {
              tag: "samp.pa.mt-0.inset.code",
              role: "status",
              aria: { labelledby: btnId },
              class: { hide: options.collapsed !== false },
              id: sampId,
              content: [
                { tag: ".sr-only", content: error.stack },
                { aria: { hidden: true }, content },
              ],
            },
          },
          {
            op: "add",
            path: "/-",
            value: {
              tag: "button",
              content: "Details",
              id: btnId,
              toggle: sampId,
              aria: { pressed: options.collapsed === false },
            },
          },
        ],
      }
    }
  } else if (options === undefined && message && typeof message === "object") {
    options = message
    message = options.message
  }

  config.content = {
    tag: ".box-center-y.pa-md",
    content: { tag: "div", content: message },
  }

  await modal(config)

  return true
}
