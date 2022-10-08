import modal from "./modal.js"
import uid from "../../core/uid.js"
import isErrorLike from "../../fabric/type/any/is/isErrorLike.js"

const DEFAULT = {
  label: "Alert",
  class: "dialog-modal dialog-alert",
  decline: false,
}

export default async function alert(message = "", options) {
  if (isErrorLike(message)) {
    const error = await import("../../fabric/type/error/normalizeError.js") //
      .then((m) => m.default(message))
    options ??= {}
    options.icon ??= "error"
    options.label ??= error.name
    message = options.message ?? error.message
    if (error.stack && error.stack !== error.message) {
      const [logHTML, formated] = await Promise.all([
        import("../../core/console/logHTML.js") //
          .then((m) => m.default),
        import("../../core/console/formats/formatError.js") //
          .then((m) => m.default(error, options.formatError)),
      ])
      const content = logHTML(formated)
      const id = uid()
      options.dialog ??= {}
      options.dialog.footer = {
        $patch: [
          {
            op: "add",
            path: "/0",
            value: {
              tag: "pre.pa.mt-0.inset.code",
              class: { hide: options.collapsed !== false },
              id,
              content,
            },
          },
          {
            op: "add",
            path: "/-",
            value: {
              tag: "button",
              content: "Details",
              toggle: id,
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

  const config = { ...DEFAULT, ...options }

  config.content = {
    tag: ".box-center-y.pa-md",
    content: { tag: "div", content: message },
  }

  const res = await modal(config)

  return res.ok
}
