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
    options ??= {}

    const error = await import("../../fabric/type/error/normalizeError.js") //
      .then((m) => m.default(message))

    options.icon ??= "error"
    options.label ??= error.name
    options.expanded ??= false

    message = options.content ?? error.message

    if (options.log === "false") {
      console.groupCollapsed(`⚠ ${error.name} - ${message}`)
      if (error instanceof AggregateError) console.dir(error)
      else console.log(error)
      console.groupEnd()
    }

    if (error.stack && error.stack !== error.message) {
      const [logAsPlan, formated] = await Promise.all([
        import("../../core/console/logAsPlan.js") //
          .then((m) => m.default),
        import("../../core/console/formatters/formatError.js") //
          .then((m) =>
            m.default(error, {
              markdown: true,
              ...options.formatError,
            }),
          ),
      ])
      const sampId = uid()
      const btnId = uid()
      options.afterContent = {
        tag: "samp.pa.inset.code.ui-dialog-demand__error",
        role: "status",
        aria: { labelledby: btnId },
        class: { hide: !options.expanded },
        id: sampId,
        content: [
          { tag: ".sr-only", content: error.stack },
          {
            aria: { hidden: true },
            content: logAsPlan(formated),
            on: {
              selector: "a.ansi--link",
              preventDefault: true,
              click(e, target) {
                import("../../os/managers/appsManager.js") //
                  .then(({ appsManager }) =>
                    appsManager.open(target.pathname + target.search),
                  )
              },
            },
          },
        ],
      }
      options.dialog ??= {}
      options.dialog.footer = {
        $patch: [
          {
            op: "replace",
            path: "/0/autofocus",
            value: true,
          },
          {
            op: "add",
            path: "/-",
            value: {
              tag: "button.ui-dialog__details",
              content: "Details",
              id: btnId,
              toggle: sampId,
              aria: { expanded: options.expanded },
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
