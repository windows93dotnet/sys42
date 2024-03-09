import demand from "./demand.js"
import uid from "../../core/uid.js"
import isErrorLike from "../../fabric/type/any/is/isErrorLike.js"

const DEFAULT = {
  label: "Alert",
  class: "ui-dialog-demand ui-dialog-alert",
  decline: false,
}

export async function alert(message = "", options) {
  if (isErrorLike(message)) {
    console.group("⚠ alert")
    console.log(message)
    console.groupEnd()

    options ??= {}
    const error = await import("../../fabric/type/error/normalizeError.js") //
      .then((m) => m.default(message))
    options.icon ??= "error"
    options.label ??= error.name
    message = options.content ?? error.message
    if (error.stack && error.stack !== error.message) {
      const [logAsPlan, formated] = await Promise.all([
        import("../../core/console/logAsPlan.js") //
          .then((m) => m.default),
        import("../../core/console/formatters/formatError.js") //
          .then((m) => m.default(error, options.formatError)),
      ])
      const content = logAsPlan(formated)
      const sampId = uid()
      const btnId = uid()
      options.dialog ??= {}
      options.dialog.footer = {
        $patch: [
          {
            op: "add",
            path: "/0",
            value: {
              tag: "samp.pa.ma-t-0.inset.code",
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
    message = options.content
  }

  const config = { ...DEFAULT, ...options }

  config.content = {
    tag: ".box-center-y.pa-md",
    content: { tag: "div", content: message },
  }

  await demand(config)

  return true
}

export default alert
